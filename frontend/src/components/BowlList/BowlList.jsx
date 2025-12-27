import React from "react";
import style from "./bowl-list.module.css";
import Bowl from "../Bowl/Bowl.jsx";

const BowlList = ({bowls, dateFormat, start}) => {
  return (
    <ol className={style["bowl-games-list"]} start={start}>
      {/* Only show bowls with at least one pick made and if they are only two days old or have not happened yet*/}
      {bowls.map((bowl) => {
        const date = new Date(bowl.startDate).toLocaleString(
          "en-US",
          dateFormat
        );
        const winnerId =
          bowl.awayPoints === null && bowl.homePoints === null
            ? undefined
            : bowl.awayPoints > bowl.homePoints
            ? bowl.away_info.id
            : bowl.homePoints > bowl.awayPoints
            ? bowl.home_info.id
            : null;
        return (
          <Bowl
            key={bowl.id}
            bowl={bowl}
            date={date}
            winnerId={winnerId}
            style={style}
          />
        );
      })}
    </ol>
  );
};

export default BowlList;
