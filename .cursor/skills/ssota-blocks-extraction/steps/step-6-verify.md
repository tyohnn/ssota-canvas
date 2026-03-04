# Step 6: Add Tests, Run, and Verify

Add tests and run until all pass. **Do not proceed to Step 7 until this passes.**

## Checklist

- [ ] Add tests for components (render with mock props)
- [ ] Add tests for logic (renderHook with mocked deps)
- [ ] Add tests for combined (mock BlockWrapper, deps)
- [ ] Run `pnpm test`
- [ ] If tests fail: read error, fix, rerun. Repeat until pass.
- [ ] Run `pnpm build`
- [ ] Fix any build/type errors

## Test Layout

```
logic/components/__tests__/
logic/logic/__tests__/
logic/combined/__tests__/
```

## Test Strategy

- **components**: mock props, assert UI and events
- **logic**: mock deps, renderHook, act
- **combined**: mock BlockWrapper, deps, assert View receives correct props
