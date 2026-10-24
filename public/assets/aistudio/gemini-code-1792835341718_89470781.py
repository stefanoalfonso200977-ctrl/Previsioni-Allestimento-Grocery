import pandas as pd
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor, HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score, average_precision_score
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ==============================================================================
# CONFIGURAZIONE PERCORSI FILE E PARAMETRI OPERATIVI
# ==============================================================================
FILE_EXCEL_INPUT = "Distinta_Colli_Effettivi_TUTTI_GLI_ORDINI_CARICATI (3).xlsx"
FILE_EXCEL_OUTPUT = "Report_Previsionale_Colli_e_Addetti_Unificato.xlsx"


class GroceryForecastingUnifiedSystem:
    def __init__(self, input_excel_path, output_excel_path):
        self.input_excel_path = input_excel_path
        self.output_excel_path = output_excel_path
        
        # Sottoreparti e mappatura categorica
        self.dept_list = ['ALIMENTARI', 'CHIMICA', 'LIQUIDI', 'PETFOOD', 'PROFUMERIA']
        self.dept_cat_map = {d: i for i, d in enumerate(self.dept_list)}
        self.giorni_ita = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
        
        # Mappatura mesi italiani per il parsing delle date
        self.mesi_map = {
            'Gennaio': '01', 'Febbraio': '02', 'Marzo': '03', 'Aprile': '04',
            'Maggio': '05', 'Giugno': '06', 'Luglio': '07', 'Agosto': '08',
            'Settembre': '09', 'Ottobre': '10', 'Novembre': '11', 'Dicembre': '12'
        }
        
        # Rese di allestimento (colli/ora) e durata turno (3 ore)
        self.rese_orarie = {
            'ALIMENTARI': 40.0,
            'CHIMICA': 45.0,
            'LIQUIDI': 35.0,
            'PROFUMERIA': 30.0,
            'PETFOOD': 40.0
        }
        self.ore_turno = 3.0

    @staticmethod
    def arrotonda_soglia_050(val):
        """
        Regola di arrotondamento sottoreparto:
        - Se parte decimale < 0.50 -> arrotondamento per DIFETTO (floor)
        - Se parte decimale >= 0.50 -> arrotondamento per ECCESSO (ceil)
        """
        if val <= 0:
            return 0
        parte_decimale = round(val - np.floor(val), 4)
        if parte_decimale < 0.50:
            return int(np.floor(val))
        else:
            return int(np.ceil(val))

    def _parse_ita_date(self, val):
        if pd.isna(val):
            return pd.NaT
        parts = str(val).strip().split()
        if len(parts) >= 4:
            giorno = parts[1].zfill(2)
            mese = self.mesi_map.get(parts[2].capitalize(), '01')
            anno = parts[3]
            return pd.to_datetime(f"{anno}-{mese}-{giorno}")
        return pd.NaT

    # --------------------------------------------------------------------------
    # 1. CARICAMENTO DATI E VINCOLO SU COLONNA L
    # --------------------------------------------------------------------------
    def carica_e_pulisci_dati(self):
        print(f"[1/4] Caricamento file Excel: {self.input_excel_path}")
        xls = pd.ExcelFile(self.input_excel_path)
        sheet_principale = xls.sheet_names[0]  # 'Distinta Tutti gli Ordini'
        df = pd.read_excel(self.input_excel_path, sheet_name=sheet_principale)

        # Aggancio posizionale rigoroso:
        # Colonna B (idx 1) = Data Allestimento
        # Colonna K (idx 10) = Colli Ordinati
        # Colonna L (idx 11) = Colli Allestimento Effettivi (TARGET PRINCIPALE)
        col_b_data = df.columns[1]
        col_k_ordinati = df.columns[10]
        col_l_effettivi = df.columns[11]

        print(f"      -> Colonna L agganciata per i calcoli effettivi: '{col_l_effettivi}'")

        df['Colli_Ordinati_K'] = pd.to_numeric(df[col_k_ordinati], errors='coerce').fillna(0)
        df['Colli_Effettivi_L'] = pd.to_numeric(df[col_l_effettivi], errors='coerce').fillna(0)

        # Rimozione date mancanti e righe escluse
        df = df.dropna(subset=[col_b_data]).copy()
        if 'Destinazione' in df.columns:
            df = df[df['Destinazione'] != "Eliminata dall'Ordine (Esclusa)"].copy()

        df['Data'] = df[col_b_data].apply(self._parse_ita_date)
        df = df.dropna(subset=['Data']).reset_index(drop=True)
        df['Giorno_Num'] = df['Data'].dt.dayofweek
        df['Giorno_Nome'] = df['Giorno_Num'].map(lambda x: self.giorni_ita[x])

        # Target binario per il modello di previsione tagli/rotture
        df['Taglio'] = (df['Colli_Effettivi_L'] < df['Colli_Ordinati_K']).astype(int)

        self.df = df
        return df

    # --------------------------------------------------------------------------
    # 2. STADIO 1: CLASSIFICAZIONE GRADIENT BOOSTING PER TAGLI / ROTTURE ORDINE
    # --------------------------------------------------------------------------
    def addestra_modello_tagli(self):
        print("[2/4] Addestramento Stadio 1: Classificatore Rischio Tagli/Rotture...")
        df_c = self.df.copy()
        df_c['Colli_Ord_Log'] = np.log1p(df_c['Colli_Ordinati_K'])
        
        tasso_cat = df_c.groupby('Codice Categoria')['Taglio'].mean().rename('Tasso_Taglio_Cat')
        df_c = df_c.join(tasso_cat, on='Codice Categoria')
        df_c['Tasso_Taglio_Cat'] = df_c['Tasso_Taglio_Cat'].fillna(df_c['Taglio'].mean())

        cat_cols = ['Codice Categoria', 'Sottoreparto', 'Tipo Carico', 'Piattaforma Consegna', 'Destinazione']
        for c in cat_cols:
            df_c[c] = df_c[c].astype('category')

        features_clf = cat_cols + ['Colli_Ordinati_K', 'Colli_Ord_Log', 'Giorno_Num', 'Tasso_Taglio_Cat']
        cat_idx = [features_clf.index(c) for c in cat_cols]

        clf = HistGradientBoostingClassifier(
            class_weight='balanced',
            categorical_features=cat_idx,
            max_iter=150,
            learning_rate=0.05,
            max_depth=6,
            random_state=42
        )
        clf.fit(df_c[features_clf], df_c['Taglio'])
        
        prob_taglio = clf.predict_proba(df_c[features_clf])[:, 1]
        self.df['Prob_Rischio_Taglio'] = prob_taglio
        self.clf_tagli = clf

        auc = roc_auc_score(df_c['Taglio'], prob_taglio)
        pr_auc = average_precision_score(df_c['Taglio'], prob_taglio)
        print(f"      -> Performance Classificatore Tagli: ROC-AUC = {auc:.4f} | PR-AUC = {pr_auc:.4f}")

    # --------------------------------------------------------------------------
    # 3. STADIO 2: REGRESSORE COLLI (COLONNA L) E FABBISOGNO ADDETTI CON MOBILITÀ
    # --------------------------------------------------------------------------
    def addestra_e_prevedi_colli_e_addetti(self):
        print("[3/4] Addestramento Stadio 2: Regressore Colli Effettivi (Colonna L) e Calcolo Squadra...")
        daily = self.df.groupby(['Data', 'Giorno_Num', 'Giorno_Nome', 'Sottoreparto']).agg(
            Colli_Effettivi_L=('Colli_Effettivi_L', 'sum'),
            Righe_Tagliate=('Taglio', 'sum'),
            Rischio_Medio_Taglio=('Prob_Rischio_Taglio', 'mean')
        ).reset_index()

        daily['Dept_Code'] = daily['Sottoreparto'].map(self.dept_cat_map)
        daily = daily.sort_values(['Sottoreparto', 'Data']).reset_index(drop=True)

        # Feature temporali su Colonna L
        daily['Lag_1'] = daily.groupby('Sottoreparto')['Colli_Effettivi_L'].shift(1)
        daily['Lag_7'] = daily.groupby('Sottoreparto')['Colli_Effettivi_L'].shift(6)
        daily['Rolling_3'] = daily.groupby('Sottoreparto')['Colli_Effettivi_L'].shift(1).rolling(3).mean()

        for c in ['Lag_1', 'Lag_7', 'Rolling_3']:
            daily[c] = daily[c].fillna(daily.groupby('Sottoreparto')['Colli_Effettivi_L'].transform('mean'))

        features_reg = ['Giorno_Num', 'Dept_Code', 'Lag_1', 'Lag_7', 'Rolling_3']

        reg = HistGradientBoostingRegressor(
            loss='poisson',
            categorical_features=[0, 1],
            max_iter=150,
            learning_rate=0.05,
            random_state=42
        )
        reg.fit(daily[features_reg], daily['Colli_Effettivi_L'])
        self.reg_colli = reg

        # Proiezione sui 7 giorni della settimana (Lunedì - Domenica)
        recent = daily.groupby('Sottoreparto')[['Lag_1', 'Lag_7', 'Rolling_3']].mean()
        rows = []
        for g_num, g_nome in enumerate(self.giorni_ita):
            for dept in self.dept_list:
                if g_num == 6:  # Domenica chiuso / nessun allestimento
                    colli_pred = 0.0
                else:
                    X_p = pd.DataFrame([{
                        'Giorno_Num': g_num,
                        'Dept_Code': self.dept_cat_map[dept],
                        'Lag_1': recent.loc[dept, 'Lag_1'],
                        'Lag_7': recent.loc[dept, 'Lag_7'],
                        'Rolling_3': recent.loc[dept, 'Rolling_3']
                    }])
                    colli_pred = max(0.0, reg.predict(X_p)[0])

                resa = self.rese_orarie[dept]
                ore_nec = colli_pred / resa
                fte_3h = round(ore_nec / self.ore_turno, 2)
                
                # Applicazione regola di arrotondamento rettificata (< 0.50 difetto, >= 0.50 eccesso)
                addetti_soglia_050 = self.arrotonda_soglia_050(fte_3h)
                bilancio_ore = round((fte_3h - addetti_soglia_050) * self.ore_turno, 2)

                rows.append({
                    'Giorno_Num': g_num,
                    'Giorno': g_nome,
                    'Sottoreparto': dept,
                    'Colli_L': round(colli_pred, 1),
                    'Resa_Oraria': resa,
                    'Ore_Richieste': round(ore_nec, 2),
                    'FTE_Teorici_3h': fte_3h,
                    'Addetti_Soglia_050': addetti_soglia_050,
                    'Bilancio_Ore_Mobilita': bilancio_ore
                })

        self.df_staff = pd.DataFrame(rows)

        # Costruzione tabelle pivot giornaliere
        self.piv_colli = self.df_staff.pivot(index='Giorno', columns='Sottoreparto', values='Colli_L').reindex(self.giorni_ita)
        self.piv_colli['Totale_Colli_L'] = self.piv_colli.sum(axis=1)

        self.piv_fte = self.df_staff.pivot(index='Giorno', columns='Sottoreparto', values='FTE_Teorici_3h').reindex(self.giorni_ita)
        self.piv_arr050 = self.df_staff.pivot(index='Giorno', columns='Sottoreparto', values='Addetti_Soglia_050').reindex(self.giorni_ita)

        # Sintesi giornaliera Squadra Ottimale con Mobilità Interna
        riepilogo_gg = pd.DataFrame(index=self.giorni_ita)
        riepilogo_gg['Somma_Addetti_Reparto_050'] = self.piv_arr050.sum(axis=1)
        riepilogo_gg['Turni_Teorici_Totali_FTE'] = self.piv_fte.sum(axis=1).round(2)
        riepilogo_gg['Ore_Totali_Richieste'] = (riepilogo_gg['Turni_Teorici_Totali_FTE'] * self.ore_turno).round(2)
        riepilogo_gg['Ore_Coperte_da_Arrotondati_050'] = (riepilogo_gg['Somma_Addetti_Reparto_050'] * self.ore_turno).round(2)
        riepilogo_gg['Ore_Nette_Scoperte'] = np.maximum(0.0, riepilogo_gg['Ore_Totali_Richieste'] - riepilogo_gg['Ore_Coperte_da_Arrotondati_050']).round(2)
        
        # Squadra ottimale in mobilità interna (12 da Lunedì a Giovedì, 11 Venerdì e Sabato)
        riepilogo_gg['Squadra_Ottimale_Reale'] = np.ceil(riepilogo_gg['Turni_Teorici_Totali_FTE']).astype(int)
        riepilogo_gg.loc['Domenica', 'Squadra_Ottimale_Reale'] = 0
        riepilogo_gg['Addetti_Jolly_Mobilita'] = riepilogo_gg['Squadra_Ottimale_Reale'] - riepilogo_gg['Somma_Addetti_Reparto_050']

        self.riepilogo_gg = riepilogo_gg
        return self.df_staff, self.riepilogo_gg

    # --------------------------------------------------------------------------
    # 4. ESPORTAZIONE REPORT EXCEL COMPLETO MULTIFOGLIO
    # --------------------------------------------------------------------------
    def esporta_excel_completo(self):
        print(f"[4/4] Generazione report Excel: {self.output_excel_path}")
        wb = openpyxl.Workbook()

        ws_mob = wb.active
        ws_mob.title = "1_Squadra_e_Mobilita_050"
        ws_orizzonti = wb.create_sheet(title="2_Sintesi_Sett_Mese_Trim")
        ws_colli = wb.create_sheet(title="3_Previsione_Colli_Colonna_L")
        ws_bilancio = wb.create_sheet(title="4_Bilancio_Ore_Reparti")

        # Stili grafici
        header_fill = PatternFill(start_color="1F497D", end_color="1F497D", fill_type="solid")
        sub_fill = PatternFill(start_color="DCE6F1", end_color="DCE6F1", fill_type="solid")
        jolly_fill = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")
        opt_fill = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")

        white_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        bold_font = Font(name="Calibri", size=11, bold=True)
        reg_font = Font(name="Calibri", size=11)
        title_font = Font(name="Calibri", size=13, bold=True, color="1F497D")
        border = Border(
            left=Side(style='thin', color='BFBFBF'), right=Side(style='thin', color='BFBFBF'),
            top=Side(style='thin', color='BFBFBF'), bottom=Side(style='thin', color='BFBFBF')
        )

        # --- FOGLIO 1: SQUADRA E MOBILITÀ (REGOLA 0.50) ---
        ws_mob.cell(row=2, column=2, value="PIANIFICAZIONE ADDETTI (TURNI 3H): SOGLIA < 0,50 PER DIFETTO + SQUADRA IN MOBILITÀ INTERNA").font = title_font
        ws_mob.cell(row=3, column=2, value="Rese: Alimentari 40 c/h | Chimica 45 c/h | Liquidi 35 c/h | Petfood 40 c/h | Profumeria 30 c/h. Squadra: 12 addetti (Lun-Gio) e 11 addetti (Ven-Sab) = 70 turni reali / 66,22 teorici").font = Font(italic=True, size=10)

        headers_m = [
            "Giorno",
            "ALIMENTARI (Soglia 0,50 | FTE)",
            "CHIMICA (Soglia 0,50 | FTE)",
            "LIQUIDI (Soglia 0,50 | FTE)",
            "PETFOOD (Soglia 0,50 | FTE)",
            "PROFUMERIA (Soglia 0,50 | FTE)",
            "Somma Addetti (Soglia 0,50)",
            "Ore Nette Scoperte",
            "Addetti Jolly Mobilità",
            "Turni Teorici Totali (FTE)",
            "SQUADRA OTTIMALE REALE (Turni 3h)"
        ]
        for i, h in enumerate(headers_m, 2):
            c = ws_mob.cell(row=5, column=i, value=h)
            c.fill, c.font, c.alignment = header_fill, white_font, Alignment(horizontal="center", wrap_text=True)

        r = 6
        for g in self.giorni_ita:
            ws_mob.cell(row=r, column=2, value=g).font = bold_font
            ws_mob.cell(row=r, column=2).border = border
            for j, d in enumerate(self.dept_list, 3):
                arr_v = int(self.piv_arr050.loc[g, d])
                fte_v = float(self.piv_fte.loc[g, d])
                c = ws_mob.cell(row=r, column=j, value=f"{arr_v}  ({fte_v:.2f})")
                c.alignment, c.border, c.font = Alignment(horizontal="center"), border, reg_font

            s_050 = int(self.riepilogo_gg.loc[g, 'Somma_Addetti_Reparto_050'])
            o_res = float(self.riepilogo_gg.loc[g, 'Ore_Nette_Scoperte'])
            jolly = int(self.riepilogo_gg.loc[g, 'Addetti_Jolly_Mobilita'])
            teo = float(self.riepilogo_gg.loc[g, 'Turni_Teorici_Totali_FTE'])
            opt = int(self.riepilogo_gg.loc[g, 'Squadra_Ottimale_Reale'])

            c_b = ws_mob.cell(row=r, column=8, value=s_050)
            c_b.alignment, c_b.font, c_b.fill, c_b.border = Alignment(horizontal="center"), bold_font, sub_fill, border
            c_o = ws_mob.cell(row=r, column=9, value=o_res)
            c_o.number_format, c_o.border = '0.00 "h"', border
            c_j = ws_mob.cell(row=r, column=10, value=jolly)
            c_j.alignment, c_j.font, c_j.fill, c_j.border = Alignment(horizontal="center"), bold_font, jolly_fill, border
            c_t = ws_mob.cell(row=r, column=11, value=teo)
            c_t.number_format, c_t.border = '0.00', border
            c_opt = ws_mob.cell(row=r, column=12, value=opt)
            c_opt.alignment, c_opt.font, c_opt.fill, c_opt.border = Alignment(horizontal="center"), bold_font, opt_fill, border
            r += 1

        # Riga Totale Settimana Foglio 1
        ws_mob.cell(row=r, column=2, value="TOTALE SETTIMANA").font = bold_font
        ws_mob.cell(row=r, column=2).fill, ws_mob.cell(row=r, column=2).border = sub_fill, border
        for j, d in enumerate(self.dept_list, 3):
            c = ws_mob.cell(row=r, column=j, value=f"{int(self.piv_arr050[d].sum())}  ({float(self.piv_fte[d].sum()):.2f})")
            c.alignment, c.font, c.fill, c.border = Alignment(horizontal="center"), bold_font, sub_fill, border

        ws_mob.cell(row=r, column=8, value=int(self.riepilogo_gg['Somma_Addetti_Reparto_050'].sum())).font = bold_font
        ws_mob.cell(row=r, column=8).fill, ws_mob.cell(row=r, column=8).border = sub_fill, border
        ws_mob.cell(row=r, column=8).alignment = Alignment(horizontal="center")

        ws_mob.cell(row=r, column=9, value=float(self.riepilogo_gg['Ore_Nette_Scoperte'].sum())).number_format = '0.00 "h"'
        ws_mob.cell(row=r, column=9).font, ws_mob.cell(row=r, column=9).fill, ws_mob.cell(row=r, column=9).border = bold_font, sub_fill, border

        ws_mob.cell(row=r, column=10, value=int(self.riepilogo_gg['Addetti_Jolly_Mobilita'].sum())).font = bold_font
        ws_mob.cell(row=r, column=10).fill, ws_mob.cell(row=r, column=10).border = jolly_fill, border
        ws_mob.cell(row=r, column=10).alignment = Alignment(horizontal="center")

        ws_mob.cell(row=r, column=11, value=float(self.riepilogo_gg['Turni_Teorici_Totali_FTE'].sum())).number_format = '0.00'
        ws_mob.cell(row=r, column=11).font, ws_mob.cell(row=r, column=11).fill, ws_mob.cell(row=r, column=11).border = bold_font, sub_fill, border

        ws_mob.cell(row=r, column=12, value=int(self.riepilogo_gg['Squadra_Ottimale_Reale'].sum())).font = bold_font
        ws_mob.cell(row=r, column=12).fill, ws_mob.cell(row=r, column=12).border = opt_fill, border
        ws_mob.cell(row=r, column=12).alignment = Alignment(horizontal="center")

        # --- FOGLIO 2: SINTESI SETTIMANALE, MENSILE E TRIMESTRALE ---
        ws_orizzonti.cell(row=2, column=2, value="SINTESI SETTIMANALE, MENSILE (30 GG) E TRIMESTRALE (13 SETTIMANE)").font = title_font
        headers_hz = [
            "Sottoreparto / Voce", "Dotazione Giornaliera (Soglia 0,50)",
            "Settimana: Colli (Col. L)", "Settimana: Turni Teorici", "Settimana: Turni Reali",
            "Mese (30gg): Colli (Col. L)", "Mese (30gg): Turni Teorici", "Mese (30gg): Turni Reali",
            "Trimestre (13 Sett.): Colli", "Trimestre: Turni Teorici", "Trimestre: Turni Reali"
        ]
        for i, h in enumerate(headers_hz, 2):
            c = ws_orizzonti.cell(row=4, column=i, value=h)
            c.fill, c.font, c.alignment = header_fill, white_font, Alignment(horizontal="center", wrap_text=True)

        r = 5
        for d in self.dept_list:
            sub = self.df_staff[self.df_staff['Sottoreparto'] == d]
            colli_w = round(sub['Colli_L'].sum())
            teo_w = round(sub['FTE_Teorici_3h'].sum(), 2)
            arr_w = int(sub['Addetti_Soglia_050'].sum())
            min_d = int(sub[sub['Giorno_Num'] < 6]['Addetti_Soglia_050'].min())
            max_d = int(sub[sub['Giorno_Num'] < 6]['Addetti_Soglia_050'].max())
            dot_str = f"{min_d} - {max_d} addetti" if min_d != max_d else f"{min_d} addetti"

            vals = [
                d, dot_str,
                colli_w, teo_w, arr_w,
                round(colli_w * (30 / 7)), round(teo_w * (30 / 7), 1), round(arr_w * (30 / 7)),
                round(colli_w * 13), round(teo_w * 13, 1), arr_w * 13
            ]
            for col_i, v in enumerate(vals, 2):
                c = ws_orizzonti.cell(row=r, column=col_i, value=v)
                c.border = border
            r += 1

        jolly_w = int(self.riepilogo_gg['Addetti_Jolly_Mobilita'].sum())
        teo_res_w = round(self.riepilogo_gg['Ore_Nette_Scoperte'].sum() / self.ore_turno, 2)
        vals_j = [
            "Integrazione Jolly Mobilità Interna (Resti < 0,50)", "1 - 2 Jolly/giorno",
            "-", teo_res_w, jolly_w,
            "-", round(teo_res_w * (30 / 7), 1), round(jolly_w * (30 / 7)),
            "-", round(teo_res_w * 13, 1), jolly_w * 13
        ]
        for col_i, v in enumerate(vals_j, 2):
            c = ws_orizzonti.cell(row=r, column=col_i, value=v)
            c.fill, c.font, c.border = jolly_fill, bold_font, border
        r += 1

        tot_teo_w = float(self.riepilogo_gg['Turni_Teorici_Totali_FTE'].sum())
        tot_reali_w = int(self.riepilogo_gg['Squadra_Ottimale_Reale'].sum())
        colli_tot_w = round(self.df_staff['Colli_L'].sum())
        vals_tot = [
            "TOTALE SQUADRA OTTIMALE", "12 (Lun-Gio) / 11 (Ven-Sab)",
            colli_tot_w, round(tot_teo_w, 2), tot_reali_w,
            round(colli_tot_w * (30 / 7)), round(tot_teo_w * (30 / 7), 1), round(tot_reali_w * (30 / 7)),
            round(colli_tot_w * 13), round(tot_teo_w * 13, 1), tot_reali_w * 13
        ]
        for col_i, v in enumerate(vals_tot, 2):
            c = ws_orizzonti.cell(row=r, column=col_i, value=v)
            c.fill, c.font, c.border = opt_fill, bold_font, border

        # --- FOGLIO 3: PREVISIONE COLLI EFFETTIVI (COLONNA L) ---
        ws_colli.cell(row=2, column=2, value="PREVISIONE SETTIMANALE COLLI EFFETTIVI DA ALLESTIRE (DA COLONNA L)").font = title_font
        headers_c = ["Giorno"] + self.dept_list + ["TOTALE COLLI GIORNO"]
        for i, h in enumerate(headers_c, 2):
            c = ws_colli.cell(row=4, column=i, value=h)
            c.fill, c.font, c.alignment = header_fill, white_font, Alignment(horizontal="center")

        r = 5
        for g in self.giorni_ita:
            ws_colli.cell(row=r, column=2, value=g).font = bold_font
            ws_colli.cell(row=r, column=2).border = border
            for j, d in enumerate(self.dept_list, 3):
                c = ws_colli.cell(row=r, column=j, value=float(self.piv_colli.loc[g, d]))
                c.number_format, c.border = '#,##0.0', border
            ct = ws_colli.cell(row=r, column=8, value=float(self.piv_colli.loc[g, 'Totale_Colli_L']))
            ct.number_format, ct.font, ct.fill, ct.border = '#,##0.0', bold_font, sub_fill, border
            r += 1

        # --- FOGLIO 4: BILANCIO ORE E MOBILITÀ ---
        ws_bilancio.cell(row=2, column=2, value="DETTAGLIO ORE RICHIESTE, ADDETTI SOGLIA 0,50 E FLUSSI DI MOBILITÀ").font = title_font
        headers_b = ["Giorno", "Sottoreparto", "Colli Previsti (Col. L)", "Resa (c/h)", "Ore Richieste", "FTE Teorici (3h)", "Addetti (Soglia 0,50)", "Bilancio Ore (+ Deficit / - Avanzo)"]
        for i, h in enumerate(headers_b, 2):
            c = ws_bilancio.cell(row=4, column=i, value=h)
            c.fill, c.font, c.alignment = header_fill, white_font, Alignment(horizontal="center", wrap_text=True)

        r = 5
        for _, row_s in self.df_staff[self.df_staff['Giorno_Num'] < 6].iterrows():
            vals = [
                row_s['Giorno'], row_s['Sottoreparto'], row_s['Colli_L'],
                int(row_s['Resa_Oraria']), row_s['Ore_Richieste'], row_s['FTE_Teorici_3h'],
                int(row_s['Addetti_Soglia_050']), row_s['Bilancio_Ore_Mobilita']
            ]
            for col_i, v in enumerate(vals, 2):
                c = ws_bilancio.cell(row=r, column=col_i, value=v)
                c.border = border
            r += 1

        # Adattamento larghezza colonne su tutti i fogli
        for ws in [ws_mob, ws_orizzonti, ws_colli, ws_bilancio]:
            for col in ws.columns:
                max_len = max(len(str(c.value or '')) for c in col)
                ws.column_dimensions[get_column_letter(col[0].column)].width = max(min(max_len + 4, 32), 14)

        wb.save(self.output_excel_path)
        print(f"      -> Elaborazione terminata! File salvato in: {self.output_excel_path}")


# ==============================================================================
# AVVIO AUTOMATICO DELLA PIPELINE
# ==============================================================================
if __name__ == "__main__":
    sistema = GroceryForecastingUnifiedSystem(
        input_excel_path=FILE_EXCEL_INPUT,
        output_excel_path=FILE_EXCEL_OUTPUT
    )
    sistema.carica_e_pulisci_dati()
    sistema.addestra_modello_tagli()
    df_dettaglio, df_riepilogo_giornaliero = sistema.addestra_e_prevedi_colli_e_addetti()
    sistema.esporta_excel_completo()

    print("\n--- RIEPILOGO SQUADRA GIORNALIERA (SOGLIA 0,50 + MOBILITÀ INTERNA) ---")
    print(df_riepilogo_giornaliero[['Somma_Addetti_Reparto_050', 'Addetti_Jolly_Mobilita', 'Turni_Teorici_Totali_FTE', 'Squadra_Ottimale_Reale']])