import React, {useEffect, useState} from 'react';
import BowlList from './components/BowlList/BowlList';

function App() {
const [bowls, setBowls] = useState([]);

useEffect(() => {
  const fetchBowls = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/bowls');
      const data = await response.json();
      console.log('Fetched bowl games:', data);
      setBowls(data);
    } catch (error) {
      console.error('Error fetching bowl games:', error);
    }
  };

  fetchBowls();
}, []);

  return (
    <>
      <header className="site-header">
        <h1>2025 College Football Postseason Bowl Games & CFP</h1>
        <p>Including team logos and regular-season records</p>
      </header>
      <main>
        <BowlList bowls={bowls} />
      </main>
    </>
  );
}

export default App;
