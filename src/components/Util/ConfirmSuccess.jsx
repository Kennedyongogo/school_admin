import { faExclamation, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import "../../Styles/_2_utils.scss";

export default function ConfirmSuccess(props) {
  function closePopUp(event) {
    let currentId = event.target.id;
    if (currentId !== "popup") props.closeConfirm(false);
  }
  return (
    <div className="confirm_bg" onClick={closePopUp}>
      <div className="confirm" id="popup">
        <div className="warning">
          <FontAwesomeIcon icon={faCheck} className="icn" color="#00FF00" />
        </div>
        <h2>Category {props.action} Successfully</h2>
        <div>
          <button
            style={{ backgroundColor: "#0064B6" }}
            onClick={() => {
              props.closeConfirm();
            }}
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}
