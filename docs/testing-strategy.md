# Testing Strategy — AgentSync CLI

## 1. TDD Approach

All features follow:

```
Red → Green → Refactor
```

No production code without tests.

---

## 2. Test Types

| Layer          | Test Type   |
| -------------- | ----------- |
| Parsers        | Unit        |
| Adapters       | Unit        |
| Transformers   | Unit        |
| AI Mapping     | Unit        |
| Masking        | Unit        |
| File System    | Integration |
| CLI Commands   | Integration |
| Full Migration | E2E         |

---

## 3. Coverage Targets

| Layer       | Coverage    |
| ----------- | ----------- |
| Core        | 100%        |
| CLI         | 85%         |
| File System | 90%         |
| E2E         | Happy paths |

---

## 4. E2E Tests

E2E tests should:

1. Load fixture config
2. Run migration
3. Compare output with expected config

```
```
