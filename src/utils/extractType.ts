export default <K>(data: K, properties: string[]): K => {
  const result = Object.create(null);
  properties.forEach((p) => {
    result[p as keyof K] = data[p as keyof K];
  });
  return result as K;
};
