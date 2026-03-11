# V1 Analysis Contracts

Locked contracts for the 4 supported analysis tools. Renderer behavior must be tested against fixture payloads in `tests/fixtures/analysis/`.

---

## total_return_cli

- **Command:** `analysis.total_return_cli`
- **Script:** `src/analysis/total_return_cli.py`
- **Supported args:** `tickers` (positional, multi), `--days`, `--realtime`, `--force`
- **Required positional:** `tickers` (1+)
- **JSON root keys:** `total_return_analysis` (array), `disclaimer`
- **Renderer target:** `chart+table`
- **Required fields per item:** `ticker`, `price_return`, `dividend_return`, `total_return`, `drip_total_return`, `dividend_count`
- **Optional/nullable:** `verdict`, `period_breakdown`, `data_quality_warnings`, `annualized_return`

## risk_metrics_cli

- **Command:** `analysis.risk_metrics_cli`
- **Script:** `src/analysis/risk_metrics_cli.py`
- **Supported args:** `ticker` (positional, single), `--days`, `--benchmark`, `--confidence`, `--var-method`, `--realtime`
- **Required positional:** `ticker` (exactly 1)
- **JSON root keys:** `ticker`, `calculation_date`, plus metric keys
- **Renderer target:** `gauges`
- **Required fields:** `ticker`, `var_95`, `sharpe_ratio`, `sortino_ratio`, `max_drawdown`, `annual_volatility`
- **Optional/nullable:** `cvar_95`, `calmar_ratio`, `beta`, `alpha` (present only with `--benchmark`)

## correlation_cli

- **Command:** `analysis.correlation_cli`
- **Script:** `src/analysis/correlation_cli.py`
- **Supported args:** `tickers` (positional, multi, min 2), `--days`, `--method`
- **Required positional:** `tickers` (2+)
- **JSON root keys:** `correlation_matrix`, `covariance_matrix`, `diversification_score`, `tickers`, `calculation_date`
- **Renderer target:** `heatmap`
- **Required fields:** `correlation_matrix.tickers`, `correlation_matrix.correlation_matrix` (nested dict of dicts)
- **Optional/nullable:** `rolling_correlations`, `concentration_warning`

## options_chain_cli

- **Command:** `analysis.options_chain_cli`
- **Script:** `src/analysis/options_chain_cli.py`
- **Supported args:** `ticker` (positional, single), `--type`, `--otm-min`, `--otm-max`, `--days-min`, `--days-max`
- **Required positional:** `ticker` (exactly 1)
- **JSON root keys:** `ticker`, `spot_price`, `contracts` (array), `scan_date`, `option_type`
- **Renderer target:** `table`
- **Required fields per contract:** `contract_symbol`, `expiration`, `strike`, `otm_pct`, `days_to_expiry`, `last_price`, `bid`, `ask`, `volume`, `open_interest`, `implied_volatility`
- **Optional/nullable:** `delta`, `gamma`, `theta`, `vega`, `total_cost`, `contracts_in_budget`

---

## Disclaimer Rule

CLI JSON includes a `disclaimer` field for `total_return_cli`. The renderer MUST always add its own visible disclaimer block regardless of payload contents:

> _Educational use only. Not investment advice. Loss of principal is possible. Consult licensed professionals._

This disclaimer must appear below every rendered analysis result.
