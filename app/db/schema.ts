import {
  boolean,
  pgTable,
  text,
  timestamp,
  serial,
  integer,
  vector,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

/* User / Auth tables */
export const user = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(), 
  emailVerified: boolean("email_verified"),
  image: text("image"),
  password: text("password"), // Add password field for email authentication
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User profiles / pathways
export const profile = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  career: text("career"),
  college: text("college"),
  program: text("program"),
  interests: jsonb("interests"),
  skills: jsonb("skills"),
  roadmap: jsonb("roadmap"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const session = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

/* RAG (Retrieval-Augmented Generation) tables */

// Sources represent the origin of documents (files, URLs, datasets)
export const source = pgTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url"),
  type: text("type").notNull(), // e.g. 'json-file', 'api'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Store only the embeddings and minimal metadata, linked to a source.
export const embedding = pgTable("embeddings", {
  id: serial("id").primaryKey(),
  sourceId: text("source_id").notNull().references(() => source.id, { onDelete: "cascade" }),
  refId: text("ref_id"),
  title: text("title"),
  campusId: text("campus_id").references(() => campus.id),
  courseId: integer("course_id").references(() => course.id),
  content: text("content"),
  metadata: jsonb("metadata"),
  contentHash: text("content_hash"),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
},
(table) => [
  index("embedding_vector_idx").using("ivfflat", table.embedding.op("vector_cosine_ops")),
  index("embedding_content_hash_idx").on(table.contentHash),
  index("embedding_source_ref_idx").on(table.sourceId, table.refId),
  index("embedding_course_idx").on(table.courseId),
]);


/* Chat / Message Persistence */

// Store chat sessions with user reference
export const chat = pgTable("chats", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title"), // optional, can be generated from first message
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Store individual messages in UIMessage format from AI SDK
export const message = pgTable("messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull().references(() => chat.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: jsonb("content").notNull(), // store complete UIMessage parts array
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* Pathway / Workflow tables */

// Campuses 
export const campus = pgTable("campuses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  instIpeds: text("inst_ipeds"),
  aliases: jsonb("aliases"),
  type: text("type"),
});

// Courses offered by campuses
export const course = pgTable("courses", {
  id: serial("id").primaryKey(),
  campusId: text("campus_id").notNull().references(() => campus.id, { onDelete: "cascade" }),
  coursePrefix: text("course_prefix").notNull(),
  courseNumber: text("course_number").notNull(),
  courseTitle: text("course_title"),
  courseDesc: text("course_desc"),
  numUnits: text("num_units"),
  deptName: text("dept_name"),
});

// Majors offered by campuses
export const major = pgTable("majors", {
  id: serial("id").primaryKey(),
  campusId: text("campus_id").notNull().references(() => campus.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
});

// Degree or Certificate codes of majors (B.S., B.A., UCert, CA, CO, etc.)
export const degree = pgTable("degrees", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name"),
  level: text("level"), // e.g. 'baccalaureate', 'associate', 'certificate', 'graduate'
});

// many-to-many table for majors and degrees
export const majorDegree = pgTable("major_degrees", {
  id: serial("id").primaryKey(),
  majorId: integer("major_id").notNull().references(() => major.id, { onDelete: "cascade" }),
  degreeId: integer("degree_id").notNull().references(() => degree.id, { onDelete: "cascade" }),
  requiredCredits: integer("required_credits"),
  typicalDuration: integer("typical_duration"), // duration in months
});

// Pathways (degree roadmap JSON ingested from files like manoa_degree_pathways.json)
export const pathway = pgTable("pathways", {
  id: text("id").primaryKey(),
  programName: text("program_name").notNull(),
  institution: text("institution"),
  totalCredits: text("total_credits"),
  pathwayData: jsonb("pathway_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("pathway_program_idx").on(table.programName),
]);
