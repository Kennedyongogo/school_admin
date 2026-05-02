import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";

const Select = forwardRef((props, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputIdRef = useRef(`input_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (props.value) {
      setInputValue(props.value);
    }
  }, [props.value]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(inputValue !== "");
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      ref.current.focus();
    },
    value: inputValue,
  }));

  return (
    <div className="select">
      <label
        className={`label ${isFocused || inputValue !== "" ? "up" : ""}`}
        htmlFor={inputIdRef.current}
      >
        {props.label}
      </label>
      <select
        onChange={(e) => {
          handleChange(e);
          if (props.setChanged) {
            props.setChanged(e.target.value);
          }
        }}
        id={inputIdRef.current}
        ref={ref}
        value={inputValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <option value=""></option>
        {props.data &&
          props.data.map((item) => {
            return (
              <option key={item} value={item}>
                {item}
              </option>
            );
          })}
      </select>
    </div>
  );
});

export default Select;
