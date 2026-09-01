import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { AuthenticatedUser } from '../types/authenticated-user.type';

export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user as AuthenticatedUser;
    return field ? user?.[field] : user;
  },
);
