import React from "react";
import PropTypes from "prop-types";
import style from "./bowl-list.module.css";

const BowlList = ({ bowls }) => {
    if (!bowls || bowls.length === 0) {
        return <p>No bowl games available at the moment.</p>;
    }

    return (
        <section className={style["bowl-list"]} aria-labelledby="bowl-list-heading">
            <header>
                <h1 id="bowl-list-heading">2025-26 College Football Bowl Games</h1>
            </header>

            <ol className="bowl-games-list">
                {bowls?.map((bowl) => {
                    if (bowl.picks.every((pick) => pick.teamId === null)) {
                        return null;
                    }
                    const date = new Date(bowl.startDate).toLocaleString("en-US", {
                        timeZone: "America/Chicago", // Forces Central Time
                        weekday: "short", // e.g., "Sat"
                        month: "short", // e.g., "Dec"
                        day: "numeric", // e.g., "13"
                        year: "numeric", // e.g., "2025"
                        hour: "numeric", // e.g., "6:00 PM"
                        minute: "2-digit", // e.g., "30"
                        timeZoneName: "short", // e.g., "CST" or "CDT"
                    });
                    const winnerId =
                        bowl.awayPoints === null && bowl.homePoints === null
                            ? undefined
                            : bowl.awayPoints > bowl.homePoints
                            ? bowl.away_info.id
                            : bowl.homePoints > bowl.awayPoints
                            ? bowl.home_info.id
                            : null;
                    return (
                        <li key={bowl.id} className="bowl-item">
                            <article className="bowl-card">
                                <header>
                                    <h2 className="bowl-name">{bowl.notes}</h2>
                                </header>

                                <dl className={style["bowl-details"]}>
                                    <div>
                                        <dt>Date</dt>
                                        <dd>{date}</dd>
                                    </div>

                                    {bowl.venue && (
                                        <div>
                                            <dt>Location</dt>
                                            <dd>{bowl.venue}</dd>
                                        </div>
                                    )}

                                    {bowl.network && (
                                        <div>
                                            <dt>Network</dt>
                                            <dd>{bowl.network}</dd>
                                        </div>
                                    )}

                                    {bowl?.line?.length > 0 && (
                                        <div>
                                            <dt>Point Spread</dt>
                                            <dd>
                                                {bowl.line.map((line, idx) => (
                                                    <p key={`${bowl.id}-line-${idx}`}>
                                                        {line.provider} {line.formattedSpread}
                                                    </p>
                                                ))}
                                            </dd>
                                        </div>
                                    )}

                                    {bowl.awayTeam && bowl.homeTeam && (
                                        <div className={style.matchup}>
                                            <dt>Matchup</dt>
                                            <dd>
                                                <img className={style.logo} src={bowl.away_info.logos[1]} alt={`${bowl.awayTeam} logo`} />
                                            </dd>
                                            <dd> at </dd>
                                            <dd>
                                                <img className={style.logo} src={bowl.home_info.logos[1]} alt={`${bowl.homeTeam} logo`} />
                                            </dd>
                                            <dd>
                                                <strong>
                                                    {bowl.awayTeam} {bowl.awayPoints ? `: ${bowl.awayPoints}` : ""}
                                                </strong>
                                            </dd>
                                            <dd></dd>{" "}
                                            <dd>
                                                <strong>
                                                    {bowl.homeTeam} {bowl.homePoints ? `: ${bowl.homePoints}` : ""}
                                                </strong>
                                            </dd>
                                            <dd>
                                                Record:{" "}
                                                {` ${bowl.away_record.regularSeason.wins}-${bowl.away_record.regularSeason.losses}-${bowl.away_record.regularSeason.ties} `}
                                            </dd>
                                            <dd></dd>
                                            <dd>
                                                Record:{" "}
                                                {` ${bowl.home_record.regularSeason.wins}-${bowl.home_record.regularSeason.losses}-${bowl.home_record.regularSeason.ties} `}
                                            </dd>
                                        </div>
                                    )}
                                </dl>

                                <div>
                                    <ul>
                                        {bowl.picks.map((pick, index) => (
                                            <li
                                                key={`${bowl.id}-pick-${index}`}
                                                data-winner={winnerId === undefined ? undefined : pick.teamId === winnerId ? "true" : "false"}
                                            >
                                                {pick.user}: {pick.teamName}
                                                {pick?.double && <strong> (Double Pick)</strong>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </article>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
};

BowlList.propTypes = {
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

BowlList.defaultProps = {
    bowls: [],
};

export default BowlList;
