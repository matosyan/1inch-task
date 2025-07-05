export class ArrayHelper {
  static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      result.push(chunk);
    }
    return result;
  }

  static keyBy(array: any[], key: string | string[], concatenation = ':'): Record<string, any> {
    if (!array || array.length === 0) {
      return {};
    }

    if (Array.isArray(key)) {
      const obj = {};
      for (const item of array) {
        const parsedKeyValues = [];
        for (let i = 0; i < key.length; i++) {
          parsedKeyValues.push(item[key[i]]);
        }

        if (parsedKeyValues.length === 2) {
          const parsedKey = parsedKeyValues.join(concatenation);
          obj[parsedKey] = item;
        }
      }

      return obj;
    }

    const obj = {};
    for (const item of array) {
      if (item[key]) {
        obj[item[key]] = item;
      }
    }

    return obj;
  }
}
