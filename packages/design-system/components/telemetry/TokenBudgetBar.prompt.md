Context-window budget readout. The only progress indicator in the system.

```jsx
<TokenBudgetBar label="context" used={412000} cached={96000} total={1100000} />
```

Track stays 3px. Consumed turns amber at ≥90% of the limit. Values are abbreviated (`412k`, `1.1M`) and rendered with tabular figures so a streaming counter never shifts the layout.
