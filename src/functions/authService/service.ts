import { 
  CognitoIdentityProviderClient, 
  SignUpCommand, 
  AdminCreateUserCommand, 
  AdminInitiateAuthCommand, 
  AdminRespondToAuthChallengeCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand
} from "@aws-sdk/client-cognito-identity-provider";
import DEBUG from '@shared/debug';

interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  tenantId: string;
  tenantName: string;
  tenantRole: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface ForgotPasswordRequest {
  username: string;
}

interface ConfirmForgotPasswordRequest {
  username: string;
  confirmationCode: string;
  newPassword: string;
}

interface ChangePasswordRequest {
  accessToken: string;
  previousPassword: string;
  proposedPassword: string;
}

export class AuthService {
  private client: CognitoIdentityProviderClient;
  
  constructor() {
    this.client = new CognitoIdentityProviderClient({ 
      region: process.env.AWS_REGION 
    });
  }

  async signUp(data: SignUpRequest): Promise<{ statusCode: number; message: string }> {
    const { email, password, firstName, lastName, username, tenantId, tenantName, tenantRole } = data;

    const signUpCommand = new SignUpCommand({
      ClientId: process.env.CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'preferred_username', Value: username },
        { Name: 'custom:tenant_id', Value: tenantId },
        { Name: 'custom:tenant_name', Value: tenantName },
        { Name: 'custom:tenant_role', Value: tenantRole },
      ],
    });

    await this.client.send(signUpCommand);
    return { statusCode: 200, message: 'User created successfully' };
  }

  async login(data: LoginRequest): Promise<{ 
    statusCode: number; 
    data: { 
      accessToken?: string;
      idToken?: string;
      refreshToken?: string;
    } 
  }> {
    const { username, password } = data;

    const authCommand = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const response = await this.client.send(authCommand);

    return {
      statusCode: 200,
      data: {
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
        refreshToken: response.AuthenticationResult?.RefreshToken,
      }
    };
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ statusCode: number; message: string }> {
    const { username } = data;

    const command = new ForgotPasswordCommand({
      ClientId: process.env.CLIENT_ID,
      Username: username,
    });

    await this.client.send(command);
    return { statusCode: 200, message: 'Password reset code sent' };
  }

  async confirmForgotPassword(data: ConfirmForgotPasswordRequest): Promise<{ statusCode: number; message: string }> {
    const { username, confirmationCode, newPassword } = data;

    const command = new ConfirmForgotPasswordCommand({
      ClientId: process.env.CLIENT_ID,
      Username: username,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    });

    await this.client.send(command);
    return { statusCode: 200, message: 'Password reset successful' };
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ statusCode: number; message: string }> {
    const { accessToken, previousPassword, proposedPassword } = data;

    const command = new ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: previousPassword,
      ProposedPassword: proposedPassword,
    });

    await this.client.send(command);
    return { statusCode: 200, message: 'Password changed successfully' };
  }
} 