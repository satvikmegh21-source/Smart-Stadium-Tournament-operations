describe('AI Predictor & Berger Scheduling Logic', () => {
  
  // 1. AI Predictor math validation
  it('should compute home/away win probabilities dynamically based on points and suspensions', () => {
    // Simulated weights logic
    const calculateProbabilities = (t1Pts: number, t2Pts: number, t1Suspended: number, t2Suspended: number) => {
      let t1Strength = 50 + t1Pts - t1Suspended * 5;
      let t2Strength = 50 + t2Pts - t2Suspended * 5;

      if (t1Strength < 10) t1Strength = 10;
      if (t2Strength < 10) t2Strength = 10;

      const total = t1Strength + t2Strength;
      const t1Prob = Math.round((t1Strength / total) * 100);
      const t2Prob = Math.round((t2Strength / total) * 100);

      return { t1Prob, t2Prob, drawProb: 100 - t1Prob - t2Prob };
    };

    // Case A: Symmetric strengths
    const resultA = calculateProbabilities(0, 0, 0, 0);
    expect(resultA.t1Prob).toBe(50);
    expect(resultA.t2Prob).toBe(50);

    // Case B: Team 1 has more points
    const resultB = calculateProbabilities(15, 5, 0, 0);
    expect(resultB.t1Prob).toBeGreaterThan(resultB.t2Prob);

    // Case C: Team 1 has suspensions
    const resultC = calculateProbabilities(0, 0, 4, 0);
    expect(resultC.t1Prob).toBeLessThan(resultC.t2Prob);
  });

  // 2. Berger Circle scheduling algorithm validation
  it('should generate correct matchup sizes for N-teams round robin brackets', () => {
    // Berger Circle algorithm helper
    const generateBergerMatchups = (teamsList: string[]) => {
      const list = [...teamsList];
      if (list.length % 2 !== 0) {
        list.push('BYE');
      }

      const numTeams = list.length;
      const rounds = numTeams - 1;
      const matchesPerRound = numTeams / 2;
      const schedule: { home: string; away: string }[] = [];

      for (let round = 0; round < rounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
          const homeIdx = (round + match) % (numTeams - 1);
          let awayIdx = (round + numTeams - 1 - match) % (numTeams - 1);

          if (match === 0) {
            awayIdx = numTeams - 1;
          }

          if (list[homeIdx] !== 'BYE' && list[awayIdx] !== 'BYE') {
            schedule.push({ home: list[homeIdx], away: list[awayIdx] });
          }
        }
      }
      return schedule;
    };

    // Case A: 4 teams (Matches = N * (N - 1) / 2 = 6 matches)
    const teams4 = ['Team A', 'Team B', 'Team C', 'Team D'];
    const matches4 = generateBergerMatchups(teams4);
    expect(matches4.length).toBe(6);

    // Verify all matchups are unique
    const uniqueMatches = new Set(matches4.map(m => [m.home, m.away].sort().join('-')));
    expect(uniqueMatches.size).toBe(6);

    // Case B: 6 teams (Matches = 6 * 5 / 2 = 15 matches)
    const teams6 = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
    const matches6 = generateBergerMatchups(teams6);
    expect(matches6.length).toBe(15);
  });
});
