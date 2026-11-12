const { start } = require("../src/start");
describe("Migration-gated API startup", () => {
    it("boots the API only after deploy migrations finish successfully", () => {
        const calls = [];
        const run = vi.fn(() => { calls.push("migrate"); return { status: 0 }; });
        const boot = vi.fn(() => calls.push("boot"));
        start({ run, boot });
        expect(calls).toEqual(["migrate", "boot"]);
        expect(run.mock.calls[0][1].slice(-2)).toEqual(["migrate", "deploy"]);
    });
    it("fails closed if migration deployment fails", () => {
        const boot = vi.fn();
        expect(() => start({ run: () => ({ status: 1 }), boot })).toThrow(/API was not started/);
        expect(boot).not.toHaveBeenCalled();
    });
});
