import React, {useEffect, useState} from 'react';
import BowlList from './components/BowlList/BowlList';

function App() {
const [bowls, setBowls] = useState([]);

useEffect(() => {
  const fetchBowls = async () => {
    try {
      const response = await fetch('/api/bowls');
      const data = await response.json();
      console.log('Fetched bowl games:', data);
      setBowls(data);
    } catch (error) {
      console.error('Error fetching bowl games:', error);
    }
  };

  fetchBowls();
}, []);

  const users = bowls[0]?.picks.map(pick => ({
    user: pick.user,
    points: bowls.reduce((total, bowl) => {
      const userPick = bowl.picks.find(p => p.user === pick.user);
      const winnerId = bowl.awayPoints === null && bowl.homePoints === null ? null : bowl.awayPoints > bowl.homePoints ? bowl.awayId : bowl.homeId;
      if (winnerId && userPick?.teamId === winnerId) {
        return total + 1;
      }
      return total;
    }, 0),
  })) || [];

  return (
    <>
      <header className="site-header">
        <h1>2025 College Football Postseason Bowl Games & CFP</h1>
        <p>Including team logos and regular-season records</p>
      </header>
      <main>
        <nav className="users-navigation">
          <ul>
            {users.sort((a, b) => b.points - a.points).map((user, idx) => (
              <li key={idx}>{user.user}: {user.points} points</li>
            ))}
          </ul>
        </nav>
        <BowlList bowls={bowls} />
      </main>
    </>
  );
}

export default App;
