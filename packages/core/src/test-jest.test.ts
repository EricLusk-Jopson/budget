describe("Jest Globals Test", () => {
  it("should recognize Jest globals", () => {
    expect(true).toBe(true);
  });

  beforeEach(() => {
    // This should not show TypeScript errors
  });
});
