import React from "react";
import style from "./bowl.module.css";

const Bowl = ({ bowl, date, winnerId }) => {
  return (
    <li key={bowl.id} className={style["bowl-game-item"]}>
      <article className={style["bowl-card"]}>
        <header>
          <h2 className="bowl-name">{bowl.notes}</h2>{" "}
          <span> ({bowl.bowl_points} points)</span>
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
                <img
                  className={style.logo}
                  src={bowl.away_info.logos[1]}
                  alt={`${bowl.awayTeam} logo`}
                />
              </dd>
              <dd> at </dd>
              <dd>
                <img
                  className={style.logo}
                  src={bowl.home_info.logos[1]}
                  alt={`${bowl.homeTeam} logo`}
                />
              </dd>
              <dd>
                <strong>
                  {bowl.away_ranking ? `${bowl.away_ranking}. ` : ""}{" "}
                  {bowl.awayTeam}{" "}
                  {bowl.awayPoints ? `: ${bowl.awayPoints}` : ""}
                </strong>
              </dd>
              <dd></dd>{" "}
              <dd>
                <strong>
                  {bowl.home_ranking ? `${bowl.home_ranking}. ` : ""}{" "}
                  {bowl.homeTeam}{" "}
                  {bowl.homePoints ? `: ${bowl.homePoints}` : ""}
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
                data-winner={
                  winnerId === undefined
                    ? undefined
                    : pick.teamId === winnerId
                    ? "true"
                    : "false"
                }
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
};

export default Bowl;
