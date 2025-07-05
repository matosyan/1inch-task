import { ReqObjectHelper } from './req-object.helper';

describe('ReqObjectHelper', () => {
  it('setLocalsReqOrRes empty', () => {
    const req: any = {};
    const set = {};
    ReqObjectHelper.setLocalsReqOrRes(req, set);

    expect(req.locals).toBe(set);
  });

  it('setLocalsReqOrRes', () => {
    const req: any = {
      locals: {
        x: 'y',
      },
    };
    const set = {
      a: 'b',
    };
    ReqObjectHelper.setLocalsReqOrRes(req, set);

    expect(req.locals).toStrictEqual({
      x: 'y',
      a: 'b',
    });
  });

  it('setLocalsReqOrRes override', () => {
    const req: any = {
      locals: {
        x: 'y',
      },
    };
    const set = {
      a: 'b',
      x: 'b',
    };
    ReqObjectHelper.setLocalsReqOrRes(req, set);

    expect(req.locals).toStrictEqual({
      x: 'b',
      a: 'b',
    });
  });
});
