export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface AppConfig {
  db: DbConfig;
  port?: number;
}

export interface Message {
  id: number;
  session_id: string;
  type: string;
  text: string | null;
  code: string | null;
  feedback_type: string | null;
  referer_id: number | null;
  quick_replies: string | null;
  buttons: string | null;
  metadata: string | null;
  created_at: Date;
}

export interface MessageData {
  id: number;
  session_id: string;
  user_journey: string | null;
  querier: string | null;
  router: string | null;
  scenario_selector: string | null;
  agent: string | null;
  generator: string | null;
  questioner: string | null;
  stat: string | null;
  created_at: Date;
}

export interface SessionData {
  share_id: string;
  session_id: string;
  messages: Message[];
  traces: MessageData[];
}
