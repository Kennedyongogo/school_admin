import { useEffect, useState, useRef } from "react";

export default function Search(props) {
  const [searchBy, setSearchBy] = useState(null);
  const [searchValue, setSearchValue] = useState(null);
  const searchRef = useRef();

  const displaySearched = () => {
    if (searchRef.current.value.length > 0) {
      setSearchValue(searchRef.current.value);
    }
  };

  return (
    <div className="search">
      <select
        name="select"
        defaultValue="Search by"
        id=""
        onChange={(e) => setSearchBy(e.target.value)}
      >
        <option value="" selected hidden>
          Search by
        </option>
        <option value="Meter Number">Meter No</option>
        <option value="Name">Name</option>
        <option value="Account">Account No</option>
      </select>
      {searchBy ? (
        <>
          <input
            type="text"
            className="searchTerm"
            id="input_text"
            placeholder={searchBy}
            ref={searchRef}
          ></input>
          <button
            type="submit"
            className="searchButton"
            onClick={displaySearched}
          >
            <i className="fa fa-search"></i>
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            className="searchTerm"
            id="input_text"
            placeholder={searchBy}
            ref={searchRef}
            disabled
          ></input>
          <button
            type="submit"
            className="searchButton"
            onClick={displaySearched}
            disabled
          >
            <i className="fa fa-search"></i>
          </button>
        </>
      )}
    </div>
  );
}
