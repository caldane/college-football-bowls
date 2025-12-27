import PropTypes from "prop-types";
import CollapsePanel from "../CollapsePanel/CollapsePanel.jsx";
import BowlList from "../BowlList/BowlList.jsx";
import style from "./bowls.module.css";

const Bowls = ({ bowls }) => {
  if (!bowls || bowls.length === 0) {
    return <p>No bowl games available at the moment.</p>;
  }

  const oldBowls = bowls.filter(
    (bowl) =>
      !bowl.picks.every((pick) => pick.teamId === null) &&
      new Date() - new Date(bowl.startDate) > 2 * 24 * 60 * 60 * 1000
  );
  const upcomingBowls = bowls.filter(
    (bowl) =>
      !bowl.picks.every((pick) => pick.teamId === null) &&
      new Date() - new Date(bowl.startDate) <= 2 * 24 * 60 * 60 * 1000
  );

  const dateFormat = {
    timeZone: "America/Chicago", // Forces Central Time
    weekday: "short", // e.g., "Sat"
    month: "short", // e.g., "Dec"
    day: "numeric", // e.g., "13"
    year: "numeric", // e.g., "2025"
    hour: "numeric", // e.g., "6:00 PM"
    minute: "2-digit", // e.g., "30"
    timeZoneName: "short", // e.g., "CST" or "CDT"
  };

  return (
    <section aria-labelledby="bowl-list-heading" className={style["bowls-page"]}>
      <header>
        <h1 id="bowl-list-heading">2025-26 College Football Bowl Games</h1>
      </header>

      <CollapsePanel title="Previous Bowl Games">
        <BowlList bowls={oldBowls} dateFormat={dateFormat} />
      </CollapsePanel>
      <CollapsePanel title="Recent and Upcoming Bowl Games" defaultState={true}>
        <BowlList bowls={upcomingBowls} dateFormat={dateFormat} start={oldBowls.length + 1} />
      </CollapsePanel>
    </section>
  );
};

Bowls.propTypes = {
  bowls: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      notes: PropTypes.string.isRequired,
      startDate: PropTypes.string.isRequired,
      venue: PropTypes.string,
      network: PropTypes.string,
      matchup: PropTypes.shape({
        team1: PropTypes.string,
        team2: PropTypes.string,
      }),
    })
  ),
};

Bowls.defaultProps = {
  bowls: [],
};

export default Bowls;
