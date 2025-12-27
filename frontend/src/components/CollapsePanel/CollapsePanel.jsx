import React from "react";
import style from "./collapse-panel.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

const CollapsePanel = ({ title, children, defaultState = false }) => {
  const [showMenu, setShowMenu] = React.useState(defaultState);

  return (
    <section className={style["collapse-panel"]} data-title={title}>
      <label onClick={() => setShowMenu((prev) => !prev)}>
        {title} <FontAwesomeIcon icon={faChevronDown} />
      </label>
      <menu data-open={showMenu}>
        <ul>
          <li>{children}</li>
        </ul>
      </menu>
    </section>
  );
};

export default CollapsePanel;
