import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";


export default class FilterInput extends React.Component {
  constructor(props) {
    super(props);
    this.input = React.createRef();
    this.getValue = this.getValue.bind(this);
    this.state = {
      value: this.props.value === undefined ? "" : this.props.value,
      type: this.props.type,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState({ value: this.props.value });
    }
    if (prevProps.type !== this.props.type) {
      this.setState({ type: this.props.type });
    }
  }

  getValue() {
    return this.state.value;
  }

  render() {
    return (
      <div className="input">
        <label htmlFor="input">{this.props.label}</label>
        {this.props.type === "textarea" ? (
          <textarea
            rows={6}
            onChange={(e) => {
              this.setState({ value: e.target.value });
              if (this.props.body) {
                let d = this.props.body;
                d[this.props.label] = e.target.value;
                this.props.setBody(d);
              }
              if (this.props.handleChange) {
                this.props.handleChange(e.target.value);
              }
            }}
            ref={this.input}
            type={this.props.type}
            placeholder={this.props.placeholder}
            value={this.state.value}
          />
        ) : (
          <div className="pwd">
            <input
              ref={this.input}
              onChange={(e) => {
                this.setState({ value: e.target.value });
                if (this.props.body) {
                  let d = this.props.body;
                  d[this.props.label] = e.target.value;
                  this.props.setBody(d);
                }
                if (this.props.handleChange) {
                  this.props.handleChange(e.target.value);
                }
              }}
              type={this.state.type}
              placeholder={this.props.placeholder}
              value={this.state.value}
            />
            {this.props.type === "password" && (
              <FontAwesomeIcon onClick={() => {
                this.setState({
                  type: this.state.type === "password" ? "text" : "password",
                });
              }} icon={faEye} />
            )}
          </div>
        )}
      </div>
    );
  }
}
