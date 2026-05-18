export const toolRiskSurvey = {
  title: "Tool / Application Risk Assessment",
  description:
    "Assess inherent and residual risk associated with a software tool or application.",

  // ✅ Hide SurveyJS header (we use page header)
  showTitle: false,
  showDescription: false,

  // ✅ Progress bar that actually communicates progress
  showProgressBar: "top",
  progressBarType: "pages",
  showPageTitles: true,
  showPageNumbers: true,
  showQuestionNumbers: false,

  pages: [
    {
      name: "step1",
      title: "Tool Details",
      elements: [
        {
          type: "text",
          name: "ToolName",
          title: "Tool / Application Name",
          isRequired: true,
          placeholder: "Enter the tool or application name"
        },

        {
          type: "text",
          name: "AssessedBy",
          title: "Assessed by",
          isRequired: true,
          placeholder: "Enter your name"
        },

        {
          type: "dropdown",
          name: "ToolCategory",
          title: "Tool category",
          description:
            "Select the category that best describes how this tool is deployed or used.",
          isRequired: true,
          choices: [
            "Admin Tool",
            "Agent",
            "Browser Extension",
            "Installed",
            "Other",
            "SaaS",
            "Script/Utility"
          ]
        },

        {
          type: "dropdown",
          name: "BusinessCriticality",
          title: "Business criticality",
          description:
            "How disruptive would loss of this tool be to business operations?",
          isRequired: true,
          choices: ["Low", "Medium", "High"]
        },

        {
          type: "dropdown",
          name: "InternetFacing",
          title: "Internet-facing?",
          description:
            "Does this system accept inbound connections from the public internet?",
          isRequired: true,
          choices: ["Yes", "No"]
        },

        {
          type: "dropdown",
          name: "DataSensitivity",
          title: "Data sensitivity",
          description:
            "Highest classification of data processed or stored by this tool.",
          isRequired: true,
          choices: ["None", "Internal", "GLBA"]
        }
      ]
    },

    {
      name: "step2",
      title: "Access & Exposure",
      elements: [
        {
          type: "dropdown",
          name: "AuthMethod",
          title: "Authentication method",
          description:
            "Primary authentication method used to access this system.",
          isRequired: true,
          choices: ["None", "Local", "AD", "SSO"]
        },

        {
          type: "dropdown",
          name: "MfaUsed",
          title: "MFA used?",
          description:
            "Is multi-factor authentication enforced for privileged or standard access?",
          isRequired: true,
          choices: ["Yes", "No"]
        },

        {
          type: "dropdown",
          name: "PrivilegeLevel",
          title: "Privilege level",
          description:
            "Highest level of access commonly granted to users of this system.",
          isRequired: true,
          choices: ["User", "Admin", "Service Account"]
        },

        {
          type: "dropdown",
          name: "Integrations",
          title: "Integrations / API",
          description:
            "Degree of external system integrations or API connectivity.",
          isRequired: true,
          choices: ["None", "Limited", "Extensive"]
        },

        {
          type: "dropdown",
          name: "Logging",
          title: "Logging",
          description:
            "Level of audit or security logging available for this system.",
          isRequired: true,
          choices: ["None", "Basic", "Full"]
        },

        {
          type: "dropdown",
          name: "UpdateCadence",
          title: "Update cadence",
          description:
            "How frequently patches or updates are applied to this system.",
          isRequired: true,
          choices: ["Automatic", "Manual", "Unknown"]
        }
      ]
    },

    {
      name: "step3",
      title: "Security Controls",
      description:
        "These controls directly influence likelihood and control effectiveness scoring.",

      elements: [
        { type: "radiogroup", name: "VulnerabilityScanning", title: "Vulnerability scanning in place?", description: "Regular vulnerability scanning or assessments are performed.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "ChangeControlRequired", title: "Change control required?", description: "Changes require documented approval and tracking.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "MonitoringAlerting", title: "Monitoring / alerting enabled?", description: "System activity is actively monitored with alerts.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "CentralLogForwarding", title: "Central log forwarding enabled?", description: "Logs are forwarded to a centralized log or SIEM platform.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "AuditLoggingEnabled", title: "Audit logging enabled?", description: "User and administrative actions are logged.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "EncryptionInTransit", title: "Encryption in transit?", description: "Data is encrypted while transmitted over the network.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "RbacImplemented", title: "RBAC implemented?", description: "Access is restricted by defined roles.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "LeastPrivilegeEnforced", title: "Least privilege enforced?", description: "Users have only the access necessary to perform duties.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "SiemInPlace", title: "SIEM in place?", description: "Security logs are reviewed by a SIEM platform.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "Soc24x7Monitoring", title: "SOC (24x7 monitoring)?", description: "Security events are monitored continuously.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "AdminAccountsSeparated", title: "Admin accounts separated?", description: "Administrative accounts are separate from user accounts.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "EncryptionAtRest", title: "Encryption at rest?", description: "Stored data is encrypted on disk.", isRequired: true, choices: ["Yes", "No"] },
        { type: "radiogroup", name: "BackupsEnabled", title: "Backups enabled?", description: "Backups are regularly performed and tested.", isRequired: true, choices: ["Yes", "No"] }
      ]
    }
  ]
};