import { ArgumentMetadata } from '@nestjs/common';
import { ParseSortParamPipe } from './parse-sort-param.pipe';

describe('ParseSortParam', () => {
  const pipe = new ParseSortParamPipe();
  const metadata: ArgumentMetadata = null;

  it('correct cases', () => {
    const cases = {
      'column.asc': ['column', 'asc'],
      'column2.desc': ['column2', 'desc'],
      'column3.asc': ['column3', 'asc'],
      'wrong.case': null,
      'edge.case.asc': null,
      "edge.case._?=)(/&%+^`').asc": null,
    };

    for (const [key, value] of Object.entries(cases)) {
      const fc = pipe.transform.bind(pipe, key, metadata);
      expect(fc).not.toThrow();
      if (value) {
        expect(fc()).toStrictEqual(value);
      } else {
        expect(fc()).toBe(value);
      }
    }
  });
});
