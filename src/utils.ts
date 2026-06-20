import { ArkErrors } from "arktype";

/**
 * Safely cancel a request body stream to free resources.
 * @param req - The request object with a body property
 */
export const cancelRequestBody = async (req: Request): Promise<void> => {
  await req.body?.cancel().catch(() => {});
};

/**
 * Validate that aclEntry exists. Returns true if valid, false if null/undefined.
 * @param aclEntry - The ACL entry to validate
 * @returns true if aclEntry exists, false otherwise
 */
export const validateAclEntry = (aclEntry: any): boolean => {
  return aclEntry != null;
};

/**
 * Validate that table exists in schema. Returns true if valid, false if null/undefined.
 * @param tableId - The table ID to look up
 * @param schema - The schema object containing table definitions
 * @returns true if table exists, false otherwise
 */
export const validateTable = (tableId: any, schema: any): boolean => {
  const table = (schema as any)[tableId];
  return table != null;
};

/**
 * Retrieve ACL rule for a specific method. Returns null if not found.
 * @param aclEntry - The ACL entry containing control rules
 * @param method - The HTTP method (GET, POST, PATCH, DELETE, etc.)
 * @returns The ACL rule or null if not found
 */
export const getAclRule = (aclEntry: any, method: string): any | null => {
  return aclEntry.control[method] ?? null;
};

/**
 * Resolve the appropriate ACL selector based on user role and query flags.
 * @param aclRule - The ACL rule object containing role-based selectors
 * @param userRole - The current user's role (or undefined for guest)
 * @param query - Query object with mine, guest, and mine|guest flags
 * @returns The resolved selector or undefined if no access
 */
export const resolveAclSelector = (
  aclRule: any,
  userRole: any,
  query: any,
): any => {
  return (
    (query["mine|guest"]
      ? ((userRole && (aclRule[userRole] ?? aclRule.mine)) ?? aclRule.guest)
      : query.guest
        ? aclRule.guest
        : userRole
          ? (aclRule[userRole] ?? aclRule.mine)
          : aclRule.guest) ?? aclRule.all
  );
};

/**
 * Apply body transformation (validation and injection) to request body.
 * Handles both single and batch operations.
 * @param body - The request body (single or array)
 * @param validateBody - Optional validation function
 * @param injectBody - Optional injection function
 * @param ctx - The request context
 * @param HttpErrorClass - The HttpError class for throwing errors
 * @param errorStatus - The status code for validation errors
 * @returns The transformed body
 * @throws HttpError if validation fails
 */
export const applyBodyTransform = async (
  body: Record<string, unknown> | Record<string, unknown>[],
  validateBody: any,
  injectBody: any,
  ctx: any,
  HttpErrorClass: any,
  errorStatus: number,
): Promise<any> => {
  let transformedBody = body;

  if (validateBody != null) {
    if (Array.isArray(transformedBody)) {
      for (let i = 0; i < transformedBody.length; i++) {
        const vb = await validateBody(
          transformedBody[i] as Record<string, unknown>,
          ctx,
        );
        if (vb instanceof ArkErrors) {
          throw new HttpErrorClass(vb.toString(), errorStatus);
        }
        transformedBody[i] = vb;
      }
    } else {
      const vb = await validateBody(transformedBody, ctx);
      if (vb instanceof ArkErrors) {
        throw new HttpErrorClass(vb.toString(), errorStatus);
      }
      transformedBody = vb;
    }
  }

  if (injectBody != null) {
    if (Array.isArray(transformedBody)) {
      for (let i = 0; i < transformedBody.length; i++) {
        const vb = await injectBody(
          transformedBody[i] as Record<string, unknown>,
          ctx,
        );
        if (vb != null) transformedBody[i] = vb as Record<string, unknown>;
      }
    } else {
      const vb = await injectBody(transformedBody, ctx);
      if (vb != null) transformedBody = vb as Record<string, unknown>;
    }
  }

  return transformedBody;
};
