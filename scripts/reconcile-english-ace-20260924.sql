BEGIN;
LOCK TABLE public.serials IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.submissions IN SHARE ROW EXCLUSIVE MODE;
DO $$
DECLARE ace_id bigint;
BEGIN
 SELECT c.id INTO STRICT ace_id FROM public.cards c JOIN public.card_sets s ON s.id=c.set_id
 WHERE s.slug='one-piece-championship-2025-ace' AND c.card_number='OP07-119';
 IF EXISTS(SELECT 1 FROM public.serials r WHERE r.card_id=ace_id AND r.serial_number>1000 AND
 (r.status IS DISTINCT FROM 'unreported' OR r.confirmed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.submissions p WHERE p.serial_id=r.id))) THEN
 RAISE EXCEPTION 'Excess Ace slots contain activity; manual review required';
 END IF;
 IF EXISTS(SELECT 1 FROM public.bulk_upload_items WHERE detected_card_id=ace_id AND detected_serial_number>1000) THEN
 RAISE EXCEPTION 'Excess Ace numbers have bulk candidates; manual review required';
 END IF;
 DELETE FROM public.serials WHERE card_id=ace_id AND serial_number>1000;
 UPDATE public.cards SET serial_total=1000 WHERE id=ace_id;
 UPDATE public.card_sets SET serials_per_card=1000 WHERE slug='one-piece-championship-2025-ace';
 IF (SELECT count(*) FROM public.serials WHERE card_id=ace_id)<>1000 THEN
 RAISE EXCEPTION 'Ace registry must contain exactly 1000 slots';
 END IF;
END $$;
COMMIT;
