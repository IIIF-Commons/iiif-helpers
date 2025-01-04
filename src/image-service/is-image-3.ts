export function isImage3(service: any) {
  const context = service['@context']
    ? Array.isArray(service['@context'])
      ? service['@context']
      : [service['@context']]
    : [];
  return context.indexOf('http://iiif.io/api/image/3/context.json') !== -1;
}
