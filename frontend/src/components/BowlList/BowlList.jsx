import React from 'react';
import PropTypes from 'prop-types';
import teams from '../../assets/json/teams.json'

const BowlList = ({ bowls }) => {
  if (!bowls || bowls.length === 0) {
    return <p>No bowl games available at the moment.</p>;
  }

  return (
    <section className="bowl-list" aria-labelledby="bowl-list-heading">
      <header>
        <h1 id="bowl-list-heading">2025–26 College Football Bowl Games</h1>
      </header>

      <ol className="bowl-games-list">
        {bowls.map((bowl) => {
            const homeTeam = teams.find(team => team.name === bowl.home_team);
            const awayTeam = teams.find(team => team.name === bowl.away_team);
            return (
          <li key={bowl.id} className="bowl-item">
            <article className="bowl-card">
              <header>
                <h2 className="bowl-name">{bowl.notes}</h2>
              </header>

              <dl className="bowl-details">
                <div>
                  <dt>Date</dt>
                  <dd>{bowl.startDate}</dd>
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

                {bowl.awayTeam && bowl.homeTeam && (
                  <div>
                    <dt>Matchup</dt>
                    <dd><img src={bowl.awayTeamLogo} alt={`${bowl.awayTeam} logo`} /></dd>
                    <dd>
                      <strong>{bowl.awayTeam} {bowl.awayPoints ? `: ${bowl.awayPoints}` : ''}</strong> vs <strong>{bowl.homeTeam} {bowl.homePoints ? `: ${bowl.homePoints}` : ''}</strong>
                    </dd>
                  </div>
                )}
              </dl>
            </article>
          </li>
        )})}
      </ol>
    </section>
  );
};

BowlList.propTypes = {
  bowls: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      location: PropTypes.string,
      time: PropTypes.string,
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