export const defaultFetcher = async (url: string) => {
  const r = await fetch(url);
  if (r.status === 200) {
    return r.json();
  }
  const err = new Error(`${r.status} ${r.statusText}`);
  err.name = 'HTTPError';
  throw err;
};
