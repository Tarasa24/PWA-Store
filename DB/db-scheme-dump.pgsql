--
-- PostgreSQL database dump
--

-- Dumped from database version 14.4 (Debian 14.4-1.pgdg110+1)
-- Dumped by pg_dump version 14.4

-- Started on 2022-08-11 18:12:34 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 16386)
-- Name: core; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA core;


--
-- TOC entry 209 (class 1259 OID 16387)
-- Name: App_appID_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core."App_appID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 211 (class 1259 OID 16389)
-- Name: App; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core."App" (
    "appID" bigint DEFAULT nextval('core."App_appID_seq"'::regclass) NOT NULL,
    name text NOT NULL,
    description text,
    lang text,
    "authorID" bigint,
    "pageURL" text NOT NULL,
    "byteSize" bigint NOT NULL,
    "iconURL" text NOT NULL,
    "colorBg" character(7),
    "colorTheme" character(7),
    screenshots text[],
    tsv_search tsvector,
    promoted boolean DEFAULT false NOT NULL
);


--
-- TOC entry 210 (class 1259 OID 16388)
-- Name: App_authorID_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core."App_authorID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3342 (class 0 OID 0)
-- Dependencies: 210
-- Name: App_authorID_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core."App_authorID_seq" OWNED BY core."App"."authorID";


--
-- TOC entry 213 (class 1259 OID 16401)
-- Name: Author; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core."Author" (
    "authorID" bigint NOT NULL,
    name text NOT NULL,
    "customConfig" json
);


--
-- TOC entry 212 (class 1259 OID 16400)
-- Name: Author_authorID_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core."Author_authorID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3343 (class 0 OID 0)
-- Dependencies: 212
-- Name: Author_authorID_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core."Author_authorID_seq" OWNED BY core."Author"."authorID";


--
-- TOC entry 216 (class 1259 OID 16665)
-- Name: Review; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core."Review" (
    "reviewID" bigint NOT NULL,
    "appID" bigint NOT NULL,
    ip text NOT NULL,
    rating smallint NOT NULL,
    body text,
    date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT valid_rating CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- TOC entry 215 (class 1259 OID 16664)
-- Name: Review_appID_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core."Review_appID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3344 (class 0 OID 0)
-- Dependencies: 215
-- Name: Review_appID_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core."Review_appID_seq" OWNED BY core."Review"."appID";


--
-- TOC entry 214 (class 1259 OID 16663)
-- Name: Review_reviewID_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core."Review_reviewID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3345 (class 0 OID 0)
-- Dependencies: 214
-- Name: Review_reviewID_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core."Review_reviewID_seq" OWNED BY core."Review"."reviewID";


--
-- TOC entry 3180 (class 2604 OID 16393)
-- Name: App authorID; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core."App" ALTER COLUMN "authorID" SET DEFAULT nextval('core."App_authorID_seq"'::regclass);


--
-- TOC entry 3182 (class 2604 OID 16404)
-- Name: Author authorID; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core."Author" ALTER COLUMN "authorID" SET DEFAULT nextval('core."Author_authorID_seq"'::regclass);


--
-- TOC entry 3183 (class 2604 OID 16668)
-- Name: Review reviewID; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core."Review" ALTER COLUMN "reviewID" SET DEFAULT nextval('core."Review_reviewID_seq"'::regclass);


--
-- TOC entry 3184 (class 2604 OID 16669)
-- Name: Review appID; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core."Review" ALTER COLUMN "appID" SET DEFAULT nextval('core."Review_appID_seq"'::regclass);


--
-- TOC entry 3193 (class 2606 OID 16408)
-- Name: Author Author_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core."Author"
    ADD CONSTRAINT "Author_pkey" PRIMARY KEY ("authorID");


--
-- TOC entry 3195 (class 2606 OID 16674)
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY ("reviewID");


--
-- TOC entry 3188 (class 2606 OID 16397)
-- Name: App appID_PK; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core."App"
    ADD CONSTRAINT "appID_PK" PRIMARY KEY ("appID");


--
-- TOC entry 3190 (class 2606 OID 16399)
-- Name: App pageURL_UNQ; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core."App"
    ADD CONSTRAINT "pageURL_UNQ" UNIQUE ("pageURL");


--
-- TOC entry 3191 (class 1259 OID 16417)
-- Name: tsv_search_idx; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX tsv_search_idx ON core."App" USING gin (tsv_search);


--
-- TOC entry 3197 (class 2606 OID 16675)
-- Name: Review appID_fk; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core."Review"
    ADD CONSTRAINT "appID_fk" FOREIGN KEY ("appID") REFERENCES core."App"("appID") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3196 (class 2606 OID 16409)
-- Name: App authorID_FK; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core."App"
    ADD CONSTRAINT "authorID_FK" FOREIGN KEY ("authorID") REFERENCES core."Author"("authorID") NOT VALID;


-- Completed on 2022-08-11 18:12:34 UTC

--
-- PostgreSQL database dump complete
--

