import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';

export type LambdaHandler = (
  event: APIGatewayProxyEventV2
) => Promise<APIGatewayProxyResult>;

export interface ErrorResponse {
  message: string;
  statusCode: number;
}

export interface SuccessResponse<T> {
  data: T;
  statusCode: number;
} 