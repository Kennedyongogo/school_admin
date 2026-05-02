export default function AccordionBody(props) {
  function getPublication(url) {
    fetch(url)
      .then((res) => {
        if (res.ok) {
          return res.blob();
        } else throw Error("");
      })
      .then((blob) => {
        var file = window.URL.createObjectURL(blob);
        window.open(file, "_blank");
      })
      .catch((e) => {});
  }

  return (
    <div className="accordion-body">
      <h4>{props.item.Title}</h4>
      <p>{props.item.Description}</p>
      <div className="accordion-footer">
        <a
          onClick={() => {
            getPublication("/api/uploads/" + props.item.File);
          }}
        >
          <i className="fa fa-download"></i> Open File
        </a>
        <p className="date">{props.item.Date.split("T")[0]}</p>
      </div>
    </div>
  );
}
