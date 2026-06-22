-- Allow clients to check disposable email domains before signup (no PII exposed)

GRANT EXECUTE ON FUNCTION public.is_email_domain_blocked(TEXT) TO anon, authenticated;
