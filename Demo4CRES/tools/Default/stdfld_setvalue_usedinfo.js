/************************************************************
 *** JSfile   : stdfld_setvalue_usedinfo.js
 *** Author   : zhuyf
 *** Date     : 2013-6-13
 *** Notes    : 该用户脚本用于批量设置标准字段列表使用情况信息
 *这里涉及的资源类型，主要是数据库表资源
 ************************************************************/

/***********************************************************************************************************************************************
   修订时间   修订版本    修改单    修改人    申请人      修改内容      修改原因          备注 

************************************************************************************************************************************************/

	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="标准字段列表使用情况信息";//说明信息

	/**
	 * 入口函数一般为外部调用
	 * 
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		var stdInfo = project.getMetadataInfoByType("stdfield");// 标准字段资源
		stdInfo.becomeWorkingCopy();//资源信息转换为可写对象
		var stdflds = stdInfo.getItems();// 标准字段条目
		var usedMap = analyseTable();//分析哪些标准字段已被使用，在一个Map中存储已使用的标准字段
		if (stdflds.length > 0) {
		for(var i in stdflds) {
			var stdfld = stdflds[i];//标准字段对象
			var stdfld_name = stdfld.getName();//标准字段名称
			if(usedMap.containsKey(stdfld_name)){//如果在Map中存在，则已被使用
				stdfld.setExtendsValue("isused","true");//使用状态设置为已使用，该属性为用户扩展属性，在项目属性/用户属性扩展中配置
				var used_detail = "";
				var subsyses = project.getAllSubsys();//获取子系统列表，返回一个数组
				for(var j in subsyses){
					var subsys = subsyses[j];//子系统名称
					if(usedMap.get(stdfld_name).containsKey(subsys))
					{
						stdfld.setExtendsValue("usedin_" + subsys,"true");//该属性用于说明在哪个子系统中使用，该属性为用户扩展属性，在项目属性/用户属性扩展中配置
						var used_info = usedMap.get(stdfld_name).get(subsys);//使用说明信息，返回一个List
						//追加使用说明信息
						used_detail += stdfld_name + "在子系统[" + subsys +"]中的表 " + used_info + " 中使用过。\r\n";
					}else{
						stdfld.setExtendsValue("usedin_" + subsys,"false");
					}
				}
				stdfld.setExtendsValue("used_detail",used_detail);//该属性为用户扩展属性，在项目属性/用户属性扩展中配置
			}else{
				stdfld.setExtendsValue("isused","false");//该字段未使用
				var subsyses = project.getAllSubsys();//获取子系统列表，返回一个数组
				for(var j in subsyses){
					var subsys = subsyses[j];//子系统名称
					stdfld.setExtendsValue("usedin_" + subsys,"false");
				}
				stdfld.setExtendsValue("used_detail",stdfld_name + "未在数据库设计中使用");
			}
		}
		stdInfo.save();//使用情况分析结果信息保存
		output.dialog("标准字段使用情况已分析，结果信息已保存，可通过打开标准字段编辑器查看！");
		output.info("标准字段使用情况已分析，结果信息已保存，可通过打开标准字段编辑器查看！");
		}else{
			output.dialog("标准字段为空，无法设置使用信息！");
			output.info("标准字段为空，无法设置使用信息！");
		}
	}

	/**
	 * 分析哪些标准字段已经在数据库表中使用
	 * 返回分析结果，为Map结构，key为字段名，value为Map（key为子系统名称，value为List，List中一项为一个表）
	 */
	function analyseTable() {
		var usedMap = stringutil.getMap();
		var subsyses = project.getAllSubsys();//获取子系统列表，返回一个数组
		for( var i in subsyses){
			var subsys = subsyses[i];//子系统名称
			output.info("正在分析子系统[" + subsys + "]");
			var resources = project.getAllDatabaseResourcesBySubsys(subsys);//获取对应子系统下数据库资源
			for ( var j in resources ) {
				var info = resources[j];
				if ( info != null ) {
					if (info.getType().toLowerCase() == "table") {// 数据库表
						var tableName = info.getTableName();// 表名
						var tableChineseName = info.getChineseName();//表中文名
						output.info("正在分析表[" + tableName +"]");
						var columns = info.getTableColumns();// 字段
						for(var k in columns) {
							var column_name = columns[k].getName();//字段名
							output.info("正在分析字段[" + column_name + "]");
							if(usedMap.containsKey(column_name)){
								//Map中以标准字段名称作为key，存放分析结果，以Map形式存放分析结果
								if(usedMap.get(column_name).containsKey(subsys)){
									//分析结果也是一个Map结构，以子系统名称为key，以List存放使用的表信息
									usedMap.get(column_name).get(subsys).add(tableName + "-" + tableChineseName);
								}else{
									var usedTableList = stringutil.getList();
									usedTableList.add(tableName + "-" + tableChineseName);
									usedMap.get(column_name).put(subsys,usedTableList);
								}
							}else{
								var subMap = stringutil.getMap();
								var usedTableList = stringutil.getList();
								usedTableList.add(tableName + "-" + tableChineseName);
								subMap.put(subsys,usedTableList);
								usedMap.put(column_name,subMap);
							}
						}
					}
				}
			}
		}
		return usedMap;
	}