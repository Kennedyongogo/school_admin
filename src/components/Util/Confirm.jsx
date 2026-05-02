import { faExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import "../../Styles/_2_utils.scss";

export default function Confirm(props) {
  function closePopUp(event) {
    let currentId = event.target.id;
    if (currentId !== "popup") props.closeConfirm(false);
  }
  return (
    <div className="confirm_bg" onClick={closePopUp}>
      <div className="confirm" id="popup">
        <div className="warning">
          <FontAwesomeIcon
            icon={faExclamation}
            className="icn"
            color="#545454"
          />
        </div>
        <h2>Are you sure {props.message}</h2>
        <p>You won't be able to revert this!</p>
        <div className="div2equal">
          <button
            style={{ backgroundColor: "#BA0C2F" }}
            onClick={() => {
              props.deleteFunction();
            }}
          >
            Yes {props.action}
          </button>
          <button
            style={{ backgroundColor: "#0064B6" }}
            onClick={() => {
              props.closeConfirm();
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
