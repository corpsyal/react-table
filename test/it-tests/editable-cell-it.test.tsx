/* eslint-disable  @typescript-eslint/no-empty-function */
/// <reference path="../typings/tests-entry.d.ts" />
import * as React from "react";
import { fireEvent } from "@testing-library/react";

import { customRender } from "../utils/react-testing-library-utils";
import EdiTableCell, { KEYCODE_ENTER } from "../../src/components/styled-table/editable-cell";
import { IContentCellProps } from "../../src/components/table/cell";
import { Nullable } from "../../src/components/typing";

interface IProps extends IContentCellProps {
  defaultValue: Nullable<number>;
  alreadyEdited?: boolean;
  checkValue?: (value: Nullable<number>) => boolean;
}

// https://stackoverflow.com/questions/52329629/intl-numberformat-behaves-incorrectly-in-jest-unit-test
const formatValue = (value: Nullable<number>) => (value === null ? "-" : `${value},00 €`);

//@ts-ignore
const focus = () => {};

const mask = {
  style: "currency",
  currency: "EUR",
  decimals: 2,
  is_percentage: false,
  is_negative: false
};

const EditableCellParent = (props: IProps) => {
  const { defaultValue, alreadyEdited, checkValue } = props;

  const [isEdited, setIsEdited] = React.useState(alreadyEdited || false);
  const [value, setValue] = React.useState(defaultValue);

  const handleOnConfirmValue = (value: Nullable<number>) => {
    setValue(value);
    setIsEdited(defaultValue !== value);
  };

  const handleValidateValue = (value: Nullable<number>) => {
    let isValidValue = true;
    if (checkValue) {
      isValidValue = checkValue(value);
    }
    return isValidValue;
  };

  return (
    <EdiTableCell
      isEdited={isEdited}
      initial_value={defaultValue}
      value={value}
      onConfirmValue={handleOnConfirmValue}
      mask={mask}
      formatValue={formatValue}
      validateValue={handleValidateValue}
    />
  );
};

describe("EditableCell component integration tests", () => {
  test("should render textInput on click", () => {
    const props = {
      defaultValue: null,
      alreadyEdited: false
    };

    const { getByText, getByTestId } = customRender(<EditableCellParent {...props} />);
    fireEvent.click(getByText("-"));
    let input = getByTestId("editable-cell-text-field").querySelector("input");
    // usage of focus : https://github.com/s-yadav/react-number-format/issues/269
    fireEvent.change(input, { target: { value: 22, focus } });
    fireEvent.keyPress(input, { keyCode: KEYCODE_ENTER });
    expect(getByText("22,00 €")).toBeTruthy();

    fireEvent.click(getByText("22,00 €"));
    input = getByTestId("editable-cell-text-field").querySelector("input");
    fireEvent.change(input, { target: { value: NaN, focus } });
    fireEvent.keyPress(input, { keyCode: KEYCODE_ENTER });
    expect(getByText("-")).toBeTruthy();
  });

  test("should display 0 when cell is cleared and it initial value is not null", () => {
    const props = {
      defaultValue: 3,
      alreadyEdited: false
    };

    const { getByText, getByTestId } = customRender(<EditableCellParent {...props} />);
    fireEvent.click(getByText("3,00 €"));
    const input = getByTestId("editable-cell-text-field").querySelector("input");
    fireEvent.change(input, { target: { value: null, focus } });
    fireEvent.keyPress(input, { keyCode: KEYCODE_ENTER });
    expect(getByText("0,00 €")).toBeTruthy();
  });

  test("shouldn't update inputValue with incorrect value", () => {
    const props = {
      defaultValue: 12,
      alreadyEdited: false,
      checkValue: (value: Nullable<number>) => (value ? value > 10 : false)
    };

    const { getByText, getByTestId } = customRender(<EditableCellParent {...props} />);

    fireEvent.click(getByText("12,00 €"));
    let input = getByTestId("editable-cell-text-field").querySelector("input");
    fireEvent.change(input, { target: { value: 8, focus } });
    fireEvent.keyPress(input, { keyCode: KEYCODE_ENTER });
    expect(getByText("12,00 €")).toBeTruthy();

    fireEvent.click(getByText("12,00 €"));
    input = getByTestId("editable-cell-text-field").querySelector("input");
    fireEvent.change(input, { target: { value: 15, focus } });
    input = getByTestId("editable-cell-text-field").querySelector("input");
    fireEvent.keyPress(input, { keyCode: KEYCODE_ENTER });
    expect(getByText("15,00 €")).toBeTruthy();
  });
});
