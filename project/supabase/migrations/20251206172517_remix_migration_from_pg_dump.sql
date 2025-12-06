CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'employee'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'employee')
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    amount numeric(12,2) NOT NULL,
    category text NOT NULL,
    expense_date date NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    receipt_url text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT expenses_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT expenses_category_check CHECK ((category = ANY (ARRAY['travel'::text, 'meals'::text, 'supplies'::text, 'equipment'::text, 'other'::text]))),
    CONSTRAINT expenses_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: salary_slips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_slips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    basic_salary numeric(12,2) DEFAULT 0 NOT NULL,
    allowances numeric(12,2) DEFAULT 0 NOT NULL,
    deductions numeric(12,2) DEFAULT 0 NOT NULL,
    net_salary numeric(12,2) GENERATED ALWAYS AS (((basic_salary + allowances) - deductions)) STORED,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    CONSTRAINT salary_slips_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT salary_slips_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text]))),
    CONSTRAINT salary_slips_year_check CHECK ((year >= 2020))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'employee'::public.app_role NOT NULL
);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: salary_slips salary_slips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_slips
    ADD CONSTRAINT salary_slips_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: salary_slips update_salary_slips_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_salary_slips_updated_at BEFORE UPDATE ON public.salary_slips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: expenses expenses_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: expenses expenses_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: salary_slips salary_slips_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_slips
    ADD CONSTRAINT salary_slips_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: salary_slips salary_slips_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_slips
    ADD CONSTRAINT salary_slips_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: salary_slips Admins can create salary slips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create salary slips" ON public.salary_slips FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: salary_slips Admins can delete salary slips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete salary slips" ON public.salary_slips FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: expenses Admins can update expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update expenses" ON public.expenses FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: salary_slips Admins can update salary slips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update salary slips" ON public.salary_slips FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: expenses Admins can view all expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all expenses" ON public.expenses FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: salary_slips Admins can view all salary slips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all salary slips" ON public.salary_slips FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: expenses Employees can create own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can create own expenses" ON public.expenses FOR INSERT WITH CHECK ((auth.uid() = employee_id));


--
-- Name: expenses Employees can update pending expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can update pending expenses" ON public.expenses FOR UPDATE USING (((auth.uid() = employee_id) AND (status = 'pending'::text)));


--
-- Name: expenses Employees can view own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can view own expenses" ON public.expenses FOR SELECT USING ((auth.uid() = employee_id));


--
-- Name: salary_slips Employees can view own salary slips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can view own salary slips" ON public.salary_slips FOR SELECT USING (((auth.uid() = employee_id) AND (status = 'published'::text)));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: salary_slips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.salary_slips ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


