const { State } = require('./State');

const portfolioState = new State({
  holdings: [],
  selectedTicker: null,
  analysisResult: null,
  activeCommand: null,
  isLoading: false,
  error: null
});

module.exports = { portfolioState };
