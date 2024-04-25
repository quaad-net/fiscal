from django.shortcuts import render
from pathlib import Path
from django.http import JsonResponse
import pandas as pd
import os

devEnv = False
if(os.getenv('QUAAD_DEV')):
        devEnv = True
        from . import uqntdb as udb
import sqlalchemy as db
if devEnv == True:
    engine = db.create_engine(f"mssql+pymssql://{udb.UQNT_USER}:{udb.UQNT_PASS}@{udb.UQNT_SERVER}:1433/{udb.UQNT_DB}")
else:
    engine = db.create_engine(f"mssql+pymssql://{os.environ.get('UQNT_USER')}:{os.environ.get('UQNT_PASS')}@{os.environ.get('UQNT_SERVER')}:1433/{os.environ.get('UQNT_DB')}")

def index(request):
    """Returns current home page"""

    return render(request, 'index.html')

def projects(request):
    return render(request, 'projects_generic.html')

def fiscal(request):
    return render(request, 'fiscal_generic.html')

def fiscal_posts(request):
    return render(request, 'fiscal_posts.html')

async def fiscalquery(request, startDate, endDate):
    
    cnxn = engine.connect()

    mainEcon = f'select round(ttl_gov_expend, 1) as ttl_gov_expend, date as yr from cbo_annual_cy_plus where date between {startDate} and {endDate} order by yr;'
    mainEcon_df = pd.read_sql(mainEcon, cnxn)
    mainEcon_jsn = mainEcon_df.to_json(orient='records')

    gov_outlays = f'select fiscal_year, classification_description as clsdesc, current_fiscal_year_to_date_gross_outlays_amount as amt from gov_outlays_by_class where fiscal_year = {startDate} and current_fiscal_year_to_date_gross_outlays_amount > 0 order by current_fiscal_year_to_date_gross_outlays_amount desc;'
    gov_outlays_df = pd.read_sql(gov_outlays, cnxn)
    gov_outlays_jsn = gov_outlays_df.to_json(orient='records')

    allObjs = [mainEcon_jsn, gov_outlays_jsn]
    cnxn.close()
    return JsonResponse(allObjs, safe= False)
    
async def update_outlays(request, year):
    cnxn = engine.connect()
    outlays = f'select fiscal_year, classification_description as clsdesc, current_fiscal_year_to_date_gross_outlays_amount as amt from gov_outlays_by_class where fiscal_year = {year} and current_fiscal_year_to_date_gross_outlays_amount > 0 order by current_fiscal_year_to_date_gross_outlays_amount desc;'
    outlays_df  = pd.read_sql(outlays, cnxn)
    outlays_jsn = outlays_df.to_json(orient='records')
    allObjs = [outlays_jsn]
    cnxn.close()
    return JsonResponse(allObjs, safe= False)

async def gov_expend_plus(request, startDate, endDate):
    cnxn = engine.connect()
    gov_expend = f'select * from gov_expend_set where date between {startDate} and {endDate};' 
    gov_expend_df = pd.read_sql(gov_expend, cnxn)
    gov_expend_jsn = gov_expend_df.to_json(orient='records')
    allObjs = [gov_expend_jsn]
    cnxn.close()
    return JsonResponse(allObjs, safe=False)

async def price_index(request, startDate, endDate):
    cnxn = engine.connect()
    price_index = f'select year(date) as yr, round(cpiaucsl, 2) as cpiaucsl, round(CSUSHPINSA, 2) as CSUSHPINSA, round(HLTHSCPIMEPS, 2) as HLTHSCPIMEPS, round(IPMAN, 2) as IPMAN, round(PPIACO , 2) as PPIACO from price_idx where year(date) between {startDate} and {endDate};'
    price_index_df = pd.read_sql(price_index, cnxn)
    price_index_jsn = price_index_df.to_json(orient='records')
    allObjs = [price_index_jsn]
    cnxn.close()
    return JsonResponse(allObjs, safe=False)

async def get_posts(request):
    cnxn = engine.connect()
    my_posts_qry = """
    select format(post_date, 'MM/dd/yyyy') as post_date, 
    post_time, auth_firstname, auth_lastname, 
    title, post_description, post, id from posts
    order by post_date desc, post_time desc
    """
    get_posts_df = pd.read_sql(my_posts_qry, cnxn)
    get_posts_jsn = get_posts_df.to_json(orient='records')
    allObjs = [get_posts_jsn]
    cnxn.close()
    return JsonResponse(allObjs, safe=False)

def test(request):
    return render(request, 'test.html')

