/************************************************************
 *** JSfile   : stdfld_noused_delete.js
 *** Author   : liaogc
 *** Date     : 2013-11-4
 *** Notes    : 根据扩展字段信息(isdelete)，判断标准字段是否需要删除，true：删除，false：保留
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
		for(var i in stdflds) {
			var stdfld = stdflds[i];//标准字段对象
			var stdfld_name = stdfld.getName();//标准字段名称
			var isDelete = stdfld.getExtendsValue("isdelete");
			if(isDelete=="true"){
				stdInfo.removeItemById(stdfld_name);
			}
		}
		stdInfo.save();
		
	  	output.dialog("成功删除删除需要删除的标准字段");
	}

	