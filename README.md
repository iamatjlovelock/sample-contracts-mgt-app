# Contracts Management Application

A sample single-user web application for managing contracts, featuring AWS Cognito authentication with scope-based authorization.

## Features

- **Authentication**: AWS Cognito user pool integration
- **Authorization**: JWT scope-based permissions (REVIEW, EDIT, APPROVE, ARCHIVE)
- **Contract Management**: Search, view, edit, approve, and archive contracts
- **Role-Based Access**: Different user types have different permissions

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│    Frontend     │  HTTP   │     Backend     │
│  React + Vite   │◄───────►│   Express.js    │
│   Port 5173     │         │    Port 3001    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ Cognito Auth              │ JWT Verify
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  AWS Cognito    │         │  contracts.json │
│   User Pool     │         │   (Database)    │
└─────────────────┘         └─────────────────┘
```

### Frontend (`/frontend`)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Auth**: AWS Amplify SDK

### Backend (`/backend`)
- **Framework**: Express.js with TypeScript
- **Auth**: aws-jwt-verify for token validation
- **Database**: JSON file storage

## User Types & Permissions

| User Type | REVIEW | EDIT | APPROVE | ARCHIVE |
|-----------|:------:|:----:|:-------:|:-------:|
| Intern | ✓ | | | |
| Outside-counsel | ✓ | ✓ | | |
| Inhouse-counsel | ✓ | ✓ | ✓ | |
| Business-operations | ✓ | ✓ | | ✓ |

Permissions are determined by the `scope` claim in the JWT access token issued by Cognito.

## Contract Attributes

| Attribute | Type | Values |
|-----------|------|--------|
| ID | String | Unique identifier (e.g., CTR-001) |
| Name | String | Contract name |
| Description | String | Brief description |
| Client | String | Client name |
| Narrative | String | Full contract narrative text |
| Region | Enum | US, CAN, UK, EUR, AUS, JAP, IND |
| Size | Enum | S, M, L, XL, XXL |
| Government | Boolean | Y, N |
| Status | Enum | Active, Archived |

## Quick Start

### Prerequisites

- Node.js 18+
- AWS Cognito User Pool (configured with custom scopes)

### 1. Clone the Repository

```bash
git clone https://github.com/iamatjlovelock/sample-contracts-mgt-app.git
cd sample-contracts-mgt-app
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```env
AWS_REGION=us-east-1
USER_POOL_ID=your-user-pool-id
USER_POOL_CLIENT_ID=your-client-id
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=your-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-client-id
VITE_API_URL=http://localhost:3001
```

### 3. Run the Application

```powershell
.\run-app.ps1
```

This starts both servers:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Or run separately:
```powershell
# Terminal 1
.\run-backend.ps1

# Terminal 2
.\run-frontend.ps1
```

## AWS Cognito Setup

### 1. Create Custom Attribute

Add `custom:user_type` attribute to your user pool:
- Type: String
- Mutable: Yes

### 2. Create Resource Server

Create a resource server with identifier `contracts` and scopes:
- `contracts:review`
- `contracts:edit`
- `contracts:approve`
- `contracts:archive`

### 3. Configure App Client

- Enable `ALLOW_USER_PASSWORD_AUTH`
- Add the custom scopes to the allowed scopes

### 4. Set Up Pre-Token Generation Lambda (Optional)

To automatically assign scopes based on user type:

```javascript
exports.handler = async (event) => {
  const userType = event.request.userAttributes['custom:user_type'];

  const scopeMap = {
    'Intern': 'contracts:review',
    'Outside-counsel': 'contracts:review contracts:edit',
    'Inhouse-counsel': 'contracts:review contracts:edit contracts:approve',
    'Business-operations': 'contracts:review contracts:edit contracts:archive',
  };

  event.response = {
    claimsAndScopeOverrideDetails: {
      accessTokenGeneration: {
        scopesToAdd: (scopeMap[userType] || 'contracts:review').split(' ')
      }
    }
  };

  return event;
};
```

### 5. Create Test Users

```bash
# Create inhouse-counsel user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_XXXXXXXX \
  --username inhouse@example.com \
  --user-attributes Name=custom:user_type,Value=Inhouse-counsel \
  --temporary-password TempPass123!

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_XXXXXXXX \
  --username inhouse@example.com \
  --password YourPassword123! \
  --permanent
```

## API Endpoints

### Authentication

#### POST `/api/auth/verify`
Verify JWT token and return user info.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "userType": "Inhouse-counsel",
  "name": "User Name"
}
```

**Response:**
```json
{
  "username": "user@example.com",
  "name": "User Name",
  "userType": "Inhouse-counsel",
  "scopes": ["REVIEW", "EDIT", "APPROVE"],
  "allowedActions": ["review", "edit", "approve"]
}
```

### Contracts

#### GET `/api/contracts`
List all contracts or search by client name.

**Headers:**
- `Authorization: Bearer <token>`
- `X-User-Type: <user-type>` (optional)

**Query Parameters:**
- `client` (optional): Search term for client name

#### GET `/api/contracts/:id`
Get a single contract by ID.

#### PATCH `/api/contracts/:id`
Perform an action on a contract.

**Body:**
```json
{
  "action": "edit|approve|archive",
  "narrative": "Updated text..."
}
```

## Project Structure

```
sample-contracts-mgt-app/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── lib/
│   │   │   ├── auth.ts           # JWT verification & scopes
│   │   │   └── contracts.ts      # Data operations
│   │   └── routes/
│   │       ├── auth.ts           # Auth endpoints
│   │       └── contracts.ts      # Contract endpoints
│   ├── data/
│   │   └── contracts.json        # Contract database
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx     # Login page
│   │   │   ├── ContractSearch.tsx # Search & list
│   │   │   └── ContractDetail.tsx # View & actions
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Auth state
│   │   ├── lib/
│   │   │   ├── amplify-config.ts # AWS config
│   │   │   └── types.ts          # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── run-app.ps1                   # Start both servers
├── run-backend.ps1               # Start backend only
├── run-frontend.ps1              # Start frontend only
└── README.md
```

## Future Enhancements

### Amazon Verified Permissions (Cedar)

The application is designed to support fine-grained authorization using Amazon Verified Permissions and the Cedar policy language. This would enable:

- **Attribute-Based Access Control**: Decisions based on contract attributes (region, size, government)
- **Group Membership**: Permissions based on Cognito groups
- **Dynamic Policies**: Centrally managed policies without code changes

Example Cedar policy:
```cedar
// Only inhouse-counsel can approve government contracts
permit(
  principal in ContractApp::UserGroup::"inhouse-counsel",
  action == ContractApp::Action::"approve",
  resource
)
when { resource.government == "Y" };

// Regional restrictions
permit(
  principal,
  action == ContractApp::Action::"edit",
  resource
)
when { principal.region == resource.region };
```

## License

MIT
