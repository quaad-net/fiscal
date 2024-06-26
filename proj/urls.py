from django.contrib import admin
from django.urls import path, include, re_path
from . import views
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.static import serve

handler500 = 'proj.views.handler500'

urlpatterns = [
    path('', views.index, name='index'),
    path('fiscal/', views.fiscal, name = 'fiscal'),
    re_path(r'fiscal/imports-n-exports/q-(?P<startDate>\d+)/' + r'(?P<endDate>\d+)', views.ImportsExports),
    re_path(r'fiscal/interest-rates/q-(?P<startDate>\d+)/' + r'(?P<endDate>\d+)', views.InterestRates),
    re_path(r'fiscal/population/q-(?P<startDate>\d+)/' + r'(?P<endDate>\d+)', views.Population),
    path('fiscal/posts', views.fiscal_posts, name = 'posts'),
    re_path(r'^fiscal/posts/charts-(?P<scriptID>\d+)/', views.get_assoc_chts, name = 'get_assoc_chts'),
    path('fiscal/posts/getcontainers', views.get_containers, name='getcontainers'),
    path('fiscal/posts/getposts', views.get_posts, name= 'getposts'), 
    re_path(r'fiscal/price-indices/q-(?P<startDate>\d+)/' + r'(?P<endDate>\d+)', views.PriceIndices),
    re_path(r'fiscal/production-n-consumption/q-(?P<startDate>\d+)/' + r'(?P<endDate>\d+)', views.ProductionConsumption),
    re_path(r'^fiscal/q-expd-(?P<startDate>\d+)/' + r'(?P<endDate>\d+)', views.gov_expend_plus, name= 'govexpend'),
    re_path(r'^fiscal/q-(?P<startDate>\d+)/' + r'(?P<endDate>\d+)', views.fiscalquery, name='fiscalquery'),
    re_path(r'^fiscal/q-outlays-(?P<year>\d+)', views.update_outlays, name= 'outlays'),
    re_path(r'^fiscal/q-outlays-drilldown-(?P<classID>\d+)', views.gov_outlays_tbl_drilldown),
    path('test/', views.test, name= 'test'),
    re_path(r'^.*/$', views.handler500),
]
