export const defaultFetcher = (url: string) => {
  return fetch(url).then((r) => {
    if (r.status === 200) {
      return r.json();
    }

    const err = new Error(`${r.status} ${r.statusText}`);
    err.name = 'HTTPError';
    throw err;
  });
};
