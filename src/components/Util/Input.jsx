import React from "react";

export default class Input extends React.Component {
  constructor(props) {
    super(props);
    this.input = React.createRef();
    this.getValue = this.getValue.bind(this);
    this.state = {
      value: this.props.value === undefined ? "" : this.props.value,
    };
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
            }}
            ref={this.input}
            type={this.props.type}
            placeholder={this.props.placeholder}
            value={this.state.value}
          />
        ) : (
          <input
            ref={this.input}
            onChange={(e) => {
              this.setState({ value: e.target.value });
              if (this.props.body) {
                let d = this.props.body;
                d[this.props.label] = e.target.value;
                this.props.setBody(d);
              }
            }}
            type={this.props.type}
            placeholder={this.props.placeholder}
            value={this.state.value}
            accept={this.props.type === "file" ? "image/*" : ""}
          />
        )}
      </div>
    );
  }
}
