// A stand-in data client (the "boundary"). Tests must mock THIS, never the code that uses it.
export function createClient() {
  return {
    from(_table: string) {
      return {
        select(_cols: string) {
          return {
            order: async (_col: string) =>
              ({ data: [] as Array<{ id: number }>, error: null as { message: string } | null }),
          };
        },
      };
    },
  };
}
