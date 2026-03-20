# Contracts Management Application - Setup Guide

## Prerequisites

- Node.js 18+
- AWS Account with Cognito User Pool
- AWS CLI configured with credentials

## AWS Cognito Setup

### 1. Configure Your Existing User Pool

Your Cognito User Pool ID: `us-east-1_M49RbNHyh`

#### Add Custom Attributes

In AWS Console > Cognito > User Pools > Your Pool > Sign-up experience > Custom attributes:

1. Add `custom:type` (String, mutable)
   - Valid values: `Intern`, `Outside-counsel`, `inhouse-counsel`, `business-operations`

2. Add `custom:name` (String, mutable)
   - User's display name

#### Create App Client

In AWS Console > Cognito > User Pools > Your Pool > App integration > App clients:

1. Create a new app client
2. Name: `contracts-app`
3. Authentication flows: Enable `ALLOW_USER_PASSWORD_AUTH`
4. No client secret (for public client)
5. Copy the Client ID to `.env.local`

### 2. Create Resource Server (Optional - for OAuth scopes)

In AWS Console > Cognito > User Pools > Your Pool > App integration > Resource servers:

1. Create resource server:
   - Identifier: `contracts`
   - Scopes:
     - `contracts/review` - View contract narratives
     - `contracts/edit` - Edit contract narratives
     - `contracts/approve` - Approve contracts
     - `contracts/archive` - Archive contracts

### 3. Create Pre-token Generation Lambda (Optional)

For dynamic scope assignment based on user type, create a Lambda trigger:

```javascript
exports.handler = async (event) => {
  const userType = event.request.userAttributes['custom:type'] || 'Intern';

  const scopeMap = {
    'Intern': ['contracts/review'],
    'Outside-counsel': ['contracts/review', 'contracts/edit'],
    'inhouse-counsel': ['contracts/review', 'contracts/edit', 'contracts/approve'],
    'business-operations': ['contracts/review', 'contracts/edit', 'contracts/archive'],
  };

  // Add scopes to the token
  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        'custom:scopes': (scopeMap[userType] || []).join(' ')
      }
    }
  };

  return event;
};
```

### 4. Create Test Users

Use AWS CLI or Console to create users:

```bash
# Create an Intern user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_M49RbNHyh \
  --username intern1 \
  --user-attributes Name=custom:type,Value=Intern Name=custom:name,Value="Test Intern" \
  --temporary-password TempPass123!

# Create Outside-counsel user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_M49RbNHyh \
  --username counsel1 \
  --user-attributes Name=custom:type,Value=Outside-counsel Name=custom:name,Value="Outside Counsel" \
  --temporary-password TempPass123!

# Create Inhouse-counsel user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_M49RbNHyh \
  --username inhouse1 \
  --user-attributes Name=custom:type,Value=inhouse-counsel Name=custom:name,Value="In-House Counsel" \
  --temporary-password TempPass123!

# Create Business-operations user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_M49RbNHyh \
  --username bizops1 \
  --user-attributes Name=custom:type,Value=business-operations Name=custom:name,Value="Business Ops" \
  --temporary-password TempPass123!
```

## Application Setup

### 1. Configure Environment Variables

Edit `.env.local`:

```env
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=us-east-1_M49RbNHyh
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<your-app-client-id>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## User Permissions

| User Type | Review | Edit | Approve | Archive |
|-----------|--------|------|---------|---------|
| Intern | Yes | No | No | No |
| Outside-counsel | Yes | Yes | No | No |
| inhouse-counsel | Yes | Yes | Yes | No |
| business-operations | Yes | Yes | No | Yes |

## Future: Amazon Verified Permissions Integration

To add fine-grained authorization based on contract attributes:

1. Create a Policy Store in Amazon Verified Permissions
2. Define Cedar schema for users, contracts, and actions
3. Create Cedar policies for fine-grained rules
4. Install `@aws-sdk/client-verifiedpermissions`
5. Update `src/lib/cedar.ts` with AVP client calls

Example fine-grained rules:
- Only inhouse-counsel can approve government contracts
- Regional restrictions based on user's assigned regions
- Size-based approval workflows

## File Structure

```
├── data/
│   └── contracts.json          # Contract database
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/verify/    # Token verification endpoint
│   │   │   └── contracts/      # Contract CRUD endpoints
│   │   ├── layout.tsx
│   │   └── page.tsx            # Main application page
│   ├── components/
│   │   ├── ContractDetail.tsx  # Contract view/edit/approve/archive
│   │   ├── ContractSearch.tsx  # Search and list contracts
│   │   └── LoginForm.tsx       # Login form
│   ├── context/
│   │   └── AuthContext.tsx     # Authentication state management
│   └── lib/
│       ├── amplify-config.ts   # AWS Amplify configuration
│       ├── auth.ts             # Token verification and scope logic
│       ├── cedar.ts            # Cedar/AVP placeholder
│       └── contracts.ts        # Contract data operations
└── .env.local                  # Environment configuration
```
