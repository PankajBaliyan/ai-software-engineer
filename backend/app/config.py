import os

JIRA_SITE_URL = os.getenv("JIRA_SITE_URL", "https://pankajbaliyan902018.atlassian.net").rstrip("/")
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY", "KAN")
SLACK_CHANNEL = os.getenv("SLACK_CHANNEL", "#ai-bug-commander")
SLACK_WORKSPACE_URL = os.getenv("SLACK_WORKSPACE_URL", "https://codewithpankaj.slack.com").rstrip("/")
