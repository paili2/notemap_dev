const calls: any[] = [];

export const useRouter = () => ({
  replace: (...args: any[]) => {
    calls.push(args);
  },
});

export const useSearchParams = () => new URLSearchParams("redirect=/dashboard");

export const getRouterCalls = () => calls.slice();
export const clearRouterCalls = () => {
  calls.length = 0;
};
